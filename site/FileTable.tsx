import * as React from 'react';
import { Component } from 'react';

import { LinkText, formatDate, formatSize } from './ui';

export const enum Field {
	Name = "name",
	Size = "size",
	Mtime = "mtime"
}

/// true - ascending, false - descending
const DEFAULT_SORTING: Map<Field, boolean> = new Map<Field, boolean>([
	[Field.Name, true],
	[Field.Size, false],
	[Field.Mtime, false]
]);

export interface FileTableEntry {
	name: string,
	mtime: number,
	size: number;
}

export interface Sort {
	field: Field,
	ascending: boolean
}

export function createSort(field: Field, oldSort?: Sort): Sort {
	let ascending: boolean = DEFAULT_SORTING.get(field);
	if (oldSort) {
		if (field == oldSort.field) {
			ascending = !oldSort.ascending;
		}
	}
	return {field: field, ascending: ascending}
}

interface FileTableProps {
	listing: FileTableEntry[]
	showSize: boolean,
	onHeaderClick?: (field: Field) => void,
	sort: Sort
}

export default class FileTable extends Component<FileTableProps> {
	public static defaultProps: Partial<FileTableProps> = {
		showSize: true
	}

	render() {
		let rows: JSX.Element[] = [];
		if (this.props.listing) {
			this.props.listing.forEach((e: FileTableEntry) => {
				rows.push(<FileTableRow showSize={this.props.showSize}
					entry={e} key={e.name} />);
			});
		}
		return (
			<table className="fileTable">
				<Header {...this.props} />
				<tbody>
					{rows}
				</tbody>
			</table>
		);
	}
}

class Header extends Component<FileTableProps> {
	render() {
		let { onHeaderClick } = this.props;
		if (!onHeaderClick)
			onHeaderClick = ()=>{};
		const headerProps = {
			...this.props,
			onHeaderClick: onHeaderClick
		}
		let sizeTd = null;
		if (this.props.showSize)
			sizeTd = (<HeaderCell {...headerProps} field={Field.Size} label="Size" />);
		return (<thead>
			<tr>
				<HeaderCell {...headerProps} field={Field.Name} label="Name" />
				{sizeTd}
				<HeaderCell {...headerProps} field={Field.Mtime} label="Modified Date" />
			</tr>
		</thead>);
	}
}

// Such inheritance is a code-smell, but done so regardless
// because it's convenient.
interface HeaderCellProps extends FileTableProps {
	field: Field,
	label: string,
	onHeaderClick: (field: Field) => void
}

const HeaderCell = (props: HeaderCellProps) => {
	let klass = "fileTable__headerCell";
	const sortedBy: boolean = props.sort.field == props.field;
	if (sortedBy) {
		if (props.sort.ascending)
			klass += " fileTable__headerCell--sortedByAsc";
		else
			klass += " fileTable__headerCell--sortedByDesc";
	}
	return <th className={klass}>
		<LinkText onClick={() => props.onHeaderClick(props.field)}>{props.label}</LinkText>
	</th>
}

interface FileTableRowProps {
	entry: FileTableEntry,
	showSize: boolean
}

const FileTableRow = (props: FileTableRowProps) => {
	let date = new Date(props.entry.mtime * 1000);
	let sizeTd = null;
	if (props.showSize)
		sizeTd = (<td>{formatSize(props.entry.size)}</td>);
	return <tr>
		<td>{props.entry.name}</td>
		{sizeTd}
		<td>{formatDate(date)}</td>
	</tr>
};
