import { ReactNode, useEffect, useState } from 'react';

import FileTable, { FileTableEntry } from "./FileTable";
import Pager, { Page } from './Pager';
import { dispatchRequestError } from './Notifier';
import { AdfOps, FileOps, MountImagesOps, UploadOps,
	FileAttr, FileRecord, ListResult, createSort } from "../app/Storage";

interface CommonTableProps {
	search: string,
	refresh: number,
	pageSize: number,
	selected: FileTableEntry[],
	onSelected?: (entries: FileTableEntry[]) => void,
	onRenderFileActions?: (file: FileTableEntry) => ReactNode,
	onRenderName?: (file: FileTableEntry) => ReactNode,
}

interface CommonTablePrivateProps {
	ops: FileOps,
	fileLinkPrefix: string,
	showSize: boolean,
}

const CommonTable = (props: CommonTableProps & CommonTablePrivateProps) => {
	const [sort, setSort] = useState(createSort(FileAttr.Name));
	const [start, setStart] = useState(0);
	const [listing, setListing] = useState<FileRecord[]>([]);
	const [total, setTotal] = useState(0);

	useEffect(() => {
		props.ops.list({
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
			showSize={props.showSize}
			sort={sort}
			selected={props.selected}
			onSelected={props.onSelected}
			fileLinkPrefix={props.fileLinkPrefix}
			onHeaderClick={(field: FileAttr) => setSort(createSort(field, sort))}
			renderName={props.onRenderName}
			renderFileActions={props.onRenderFileActions}
		/>
		<Pager
			page={new Page(start, props.pageSize)}
			total={total}
			onPageChanged={page => setStart(page.start)}
		/>
	</>);
}

CommonTable.defaultProps = {
	showSize: true,
};

export const AdfTable = (props: CommonTableProps) =>
	<CommonTable ops={AdfOps} showSize={false} fileLinkPrefix="/api/adf/image" {...props} />;

export const MountImagesTable = (props: CommonTableProps) =>
	<CommonTable ops={MountImagesOps} fileLinkPrefix="/api/mountimg" {...props} />;

export const UploadTable = (props: CommonTableProps) =>
	<CommonTable ops={UploadOps} fileLinkPrefix="/api/upload" {...props} />;
