import { ReactNode, useState } from 'react';

import { ActionSet } from './Actions';
import { FileRecord, FileAttr, Sort } from '../app/Storage';

import { CheckBox } from '../ui/CheckBox';
import { LinkText } from '../ui/Link';
import { formatDate, formatSize } from '../ui/ui';
import { Table, TableRecord, SelectCell, TableLink, CellPane, DataCell, HeaderCell as THeaderCell, HeaderSelectCell } from '../ui/Table';

import * as responsive from '../responsive';

export import Field = FileAttr;
export type FileTableEntry = FileRecord;

type FileRenderFunc = (file: FileTableEntry) => ReactNode;

interface FileTableProps {
	listing: FileTableEntry[]
	showSize?: boolean,
	onHeaderClick?: (field: Field) => void,
	onSelected?: (entries: FileTableEntry[]) => void,
	selected?: FileTableEntry[],
	sort?: Sort,
	fileLinkPrefix?: string
	renderName?: FileRenderFunc
	renderFileActions?: FileRenderFunc
}

const FileTable = ({
	showSize = true,
	selected = [],
	...props
}: FileTableProps) => {
	const [selectedAll, setSelectedAll] = useState(false);

	function renderEntryUrl(entry: FileTableEntry) {
		const url = entryUrl(entry);
		if (url != null) {
			return <a css={TableLink} href={url}>{entry.name}</a>;
		} else {
			return <span>{entry.name}</span>;
		}
	}

	function entryUrl(entry: FileTableEntry) {
		let url = null;
		if (props.fileLinkPrefix) {
			url = props.fileLinkPrefix;
			if (!url.endsWith("/"))
				url += "/";
			url += entry.name;
		}
		return url;
	}

	function isSelected(name: string): boolean {
		return selected &&
			selected.findIndex(e => e.name == name) > -1;
	}

	function selectItem(name: string): void {
		const idx: number = selected.findIndex(e => e.name == name);
		if (idx == -1) {
			selected.push(props.listing.find(e => e.name == name));
		} else {
			selected.splice(idx, 1);
		}
		callbackSelected(selected);
	}

	function callbackSelected(entries: FileTableEntry[]) {
		if (props.onSelected)
			props.onSelected(entries);
	}

	function selectAll() {
		const select = !selectedAll;
		const selected = select ?
			props.listing.slice() :
			[];
		setSelectedAll(select);
		callbackSelected(selected);
	}

	let rows: JSX.Element[] = [];
	if (props.listing) {
		const renderName = props.renderName || renderEntryUrl;
		props.listing.forEach((e: FileTableEntry) => {
			rows.push(<FileTableRow
				entry={e} key={e.name} showSize={showSize}
				renderName={renderName}
				renderFileActions={props.renderFileActions}
				selected={isSelected(e.name)}
				onSelected={props.onSelected && selectItem || null}
			/>);
		});
	}
	return (
		<Table css={{width: "100%"}}>
			<Header {...props} showSize={showSize} selected={selected} selectedAll={selectedAll}
				onSelected={props.onSelected && selectAll || null} />
			<tbody>
				{rows}
			</tbody>
		</Table>
	);
}

interface HeaderProps extends FileTableProps {
	selectedAll: boolean,
	onSelected: () => void
}

const Header = (props: HeaderProps) => {
	let sizeTd = null;
	if (props.showSize)
		sizeTd = (<HeaderCell {...props} field={Field.Size} label="Size" css={{width: "4em"}} />);
	return (<thead>
		<tr>
			{props.onSelected &&
			<HeaderSelectCell>
				<CellPane>
					<CheckBox checked={props.selectedAll}
						onClick={props.onSelected} />
				</CellPane>
			</HeaderSelectCell>}
			<HeaderCell {...props} field={Field.Name} label="Name" />
			{sizeTd}
			<HeaderCell {...props} field={Field.Mtime} label="Modified Date" rightmost
				css={{
					[`@media (${responsive.normalScreen})`]: {
						width: "9em",
					},
					[`@media (${responsive.tightScreen})`]: {
						width: "4em",
					},
				}} />
		</tr>
	</thead>);
}

// Such inheritance is a code-smell, but done so regardless
// because it's convenient.
interface HeaderCellProps extends FileTableProps {
	field: Field,
	label: string,
	onHeaderClick?: (field: Field) => void,
	rightmost?: boolean,
	className?: string,
}

const HeaderCell = (props: HeaderCellProps) => {
	let label: ReactNode;
	if (props.onHeaderClick) {
		label = <LinkText css={TableLink} onClick={() => props.onHeaderClick(props.field)}>{props.label}</LinkText>;
	} else {
		label = <span>{props.label}</span>
	}
	return <THeaderCell className={props.className} rightmost={props.rightmost}>{label}</THeaderCell>;
}

interface FileTableRowProps {
	entry: FileTableEntry,
	showSize: boolean,
	selected: boolean,
	onSelected: (name: string) => void,
	url?: string
	renderName: FileRenderFunc
	renderFileActions: FileRenderFunc
}

const FileTableRow = (props: FileTableRowProps) => {

	function renderSelectCell(): ReactNode {
		if (props.onSelected) {
			return (<td css={SelectCell}>
				<CellPane>
					<CheckBox name={props.entry.name}
						checked={props.selected}
						onClick={props.onSelected} />
				</CellPane>
			</td>);
		}
		return null;
	}

	function renderNameCell(): ReactNode {
		return (<DataCell>
			<CellPane>
				{renderName()}
				{renderActions()}
			</CellPane>
		</DataCell>)
	}

	function renderName(): ReactNode {
		return props.renderName(props.entry);
	}

	function renderSizeCell(): ReactNode {
		if (props.showSize)
			return <DataCell>{formatSize(props.entry.size)}</DataCell>;
		return null;
	}

	function renderDateCell(): ReactNode {
		const date = new Date(props.entry.mtime * 1000);
		return <DataCell>{formatDate(date)}</DataCell>
	}

	function renderActions(): ReactNode {
		if (props.renderFileActions) {
			return (<ActionSet right>
				{props.renderFileActions(props.entry)}
			</ActionSet>);
		}
		return null;
	}

	return (<TableRecord>
		{renderSelectCell()}
		{renderNameCell()}
		{renderSizeCell()}
		{renderDateCell()}
	</TableRecord>);
};

export default FileTable;
