import { ReactNode, useEffect, useState } from 'react';

import FileTable, { FileTableEntry } from "./FileTable";
import Pager, { Page } from './Pager';
import { dispatchRequestError } from './Notifier';
import { AdfOps, FileAttr, FileRecord, ListResult, createSort } from "../app/Storage";

interface AdfTableProps {
	search: string,
	refresh: number,
	pageSize: number,
	selected: FileTableEntry[],
	onSelected?: (entries: FileTableEntry[]) => void,
	onRenderFileActions?: (file: FileTableEntry) => ReactNode,
}

export const AdfTable = (props: AdfTableProps) => {
	const [sort, setSort] = useState(createSort(FileAttr.Name));
	const [start, setStart] = useState(0);
	const [listing, setListing] = useState<FileRecord[]>([]);
	const [total, setTotal] = useState(0);

	useEffect(() => {
		AdfOps.list({
			filter: props.search,
			sort: sort,
			start: start,
			limit: props.pageSize,
		}).then((res: ListResult) => {
			setListing(res.listing);
			setTotal(res.total);
		}).catch((err: Error) => {
			dispatchRequestError(err);
		});
	}, [sort, start, props.search, props.pageSize, props.refresh]);

	return (<>
		<FileTable
			listing={listing}
			showSize={false}
			sort={sort}
			selected={props.selected}
			onSelected={props.onSelected}
			fileLinkPrefix="/api/adf/image"
			onHeaderClick={(field: FileAttr) => setSort(createSort(field, sort))}
			renderFileActions={props.onRenderFileActions}
		/>
		<Pager
			page={new Page(start, props.pageSize)}
			total={total}
			onPageChanged={page => setStart(page.start)}
		/>
	</>);
}
