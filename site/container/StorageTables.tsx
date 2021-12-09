import { ReactNode, useEffect, useState } from 'react';

import { Actions, ActionSet } from '../component/Actions';
import FileTable, { FileTableEntry } from "../component/FileTable";
import Pager, { Page } from '../component/Pager';
import { dispatchBulkResultErrors, dispatchRequestError } from '../component/Notifier';

import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/Modal';
import List from '../ui/List';

import { AdfOps, FileOps, MountImagesOps, UploadOps,
	BulkResult, FileAttr, FileRecord, ListResult, createSort } from "../app/Storage";

interface CommonTableProps {
	actions?: ReactNode,
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
	const [deleting, setDeleting] = useState(false);
	const [refresh, setRefresh] = useState(0);
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
	}, [sort, start, props.search, props.pageSize, props.refresh, refresh]);

	function remove(files: FileTableEntry[]) {
		setDeleting(false);
		props.ops.remove(files.map(e => e.name))
			.then((result: BulkResult) => {
				dispatchBulkResultErrors("Delete error", result);
				props.onSelected && props.onSelected([]);
				setRefresh(refresh + 1);
			 })
			.catch(e => dispatchRequestError(e));
	}

	return (<>
		{deleting && (
			<ConfirmModal text="Delete these files?"
				onAccept={() => remove(props.selected)}
				onCancel={() => setDeleting(false)}
				acceptText="Delete"
				acceptPurpose="delete">
				<List listing={props.selected.map(e => e.name)} />
			</ConfirmModal>
		)}
		<Actions>
			{props.actions && (
				<ActionSet>
					{props.actions}
				</ActionSet>
			)}
			<ActionSet right={true}>
				<Button purpose="delete"
					disabled={props.selected.length == 0}
					onClick={() => setDeleting(true)} />
			</ActionSet>
		</Actions>
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
