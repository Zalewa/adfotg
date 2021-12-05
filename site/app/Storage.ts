import * as request from 'superagent';

import { SortDirection } from './Listing';

export interface FileRecord {
	name: string
	mtime: number
	size: number
}

export const enum FileAttr {
	Name = "name",
	Size = "size",
	Mtime = "mtime"
}

export interface Sort {
	attr: FileAttr,
	dir: SortDirection
}

const DEFAULT_SORTING: Map<FileAttr, SortDirection> = new Map<FileAttr, SortDirection>([
	[FileAttr.Name, 'asc'],
	[FileAttr.Size, 'desc'],
	[FileAttr.Mtime, 'desc']
]);

export function createSort(attr: FileAttr, oldSort?: Sort): Sort {
	let dir: SortDirection = DEFAULT_SORTING.get(attr);
	if (oldSort && attr == oldSort.attr) {
		dir = oldSort.dir === 'asc' ? 'desc' : 'asc';
	}
	return {attr: attr, dir: dir}
}

export interface ListOptions {
	filter: string
	sort: Sort
	start: number
	limit: number
}

export interface ListResult {
	listing: FileRecord[]
	total: number
}

type ListOp = (opts: ListOptions) => Promise<ListResult>;

interface FileOps {
	list: ListOp
}

function listQuery(endpoint: string, opts: ListOptions) {
	return new Promise<ListResult>((resolve, reject) => {
		request.get(endpoint).query({
			filter: opts.filter,
			sort: opts.sort.attr,
			dir: opts.sort.dir,
			start: opts.start,
			limit: opts.limit,
		}).end((err, res) => {
			if (!err) {
				resolve({
					listing: res.body.listing,
					total: res.body.total,
				});
			} else {
				reject(err);
			}
		})
	});
}

export const AdfOps: FileOps = {
	list: function(opts: ListOptions) {
		return listQuery('/api/adf/image', opts);
	}
}
