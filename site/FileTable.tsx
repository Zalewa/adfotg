import * as React from 'react';
import { Component, PureComponent } from 'react';

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

interface FileTableState {
	selected: string[],
	selectedAll: boolean
}

export default class FileTable extends Component<FileTableProps, FileTableState> {
	public static defaultProps: Partial<FileTableProps> = {
		showSize: true
	}

	state: Readonly<FileTableState> = {
		selected: [],
		selectedAll: false
	}

	constructor(props: FileTableProps) {
		super(props);
		this.onSelect = this.onSelect.bind(this);
		this.onSelectAll = this.onSelectAll.bind(this);
	}

	render() {
		let rows: JSX.Element[] = [];
		if (this.props.listing) {
			this.props.listing.forEach((e: FileTableEntry) => {
				rows.push(<FileTableRow
					entry={e} key={e.name} showSize={this.props.showSize}
					selected={this.isSelected(e.name)}
					onSelected={this.onSelect}
				/>);
			});
		}
		return (
			<table className="fileTable">
				<Header {...this.props} selected={this.state.selectedAll} onSelected={this.onSelectAll} />
				<tbody>
					{rows}
				</tbody>
			</table>
		);
	}

	private isSelected(name: string): boolean {
		return this.state.selected.indexOf(name) > -1;
	}

	private onSelectAll() {
		const select: boolean = !this.state.selectedAll;
		const selected: string[] = select ?
			this.props.listing.map(e => e.name) :
			[];
		this.setState({selected: selected, selectedAll: select})
	}

	private onSelect(e: React.ChangeEvent<HTMLInputElement>): void {
		this.select(e.target.name);
	}

	private select(name: string): void {
		const selected = this.state.selected;
		const idx: number = selected.indexOf(name);
		if (idx == -1) {
			selected.push(name);
		} else {
			selected.splice(idx, 1);
		}
		this.setState({selected: selected});
	}
}

interface HeaderProps extends FileTableProps {
	selected: boolean,
	onSelected: () => void
}

class Header extends Component<HeaderProps> {
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
				<th>
					<input name="selectAll" type="checkbox"
						checked={this.props.selected}
						onChange={this.props.onSelected} />
				</th>
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
	showSize: boolean,
	selected: boolean,
	onSelected: (e: React.ChangeEvent<HTMLInputElement>) => void
}

class FileTableRow extends PureComponent<FileTableRowProps> {
	render() {
		const props = this.props;
		let date = new Date(props.entry.mtime * 1000);
		let sizeTd = null;
		if (props.showSize)
			sizeTd = (<td>{formatSize(props.entry.size)}</td>);
		return (<tr>
			<td>
				<input name={props.entry.name} type="checkbox"
				checked={props.selected}
				onChange={props.onSelected} />
			</td>
			<td>{props.entry.name}</td>
			{sizeTd}
			<td>{formatDate(date)}</td>
		</tr>);
	}
};
