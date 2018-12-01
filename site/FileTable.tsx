import * as React from 'react';
import { Component, PureComponent } from 'react';
import { boundMethod } from 'autobind-decorator';

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
	onSelected?: (entries: FileTableEntry[]) => void,
	selected: FileTableEntry[],
	sort: Sort,
	fileLinkPrefix?: string
}

interface FileTableState {
	selectedAll: boolean
}

export default class FileTable extends Component<FileTableProps, FileTableState> {
	public static defaultProps: Partial<FileTableProps> = {
		showSize: true,
		selected: []
	}

	state: Readonly<FileTableState> = {
		selectedAll: false
	}

	render() {
		let rows: JSX.Element[] = [];
		if (this.props.listing) {
			this.props.listing.forEach((e: FileTableEntry) => {
				const url = this.props.fileLinkPrefix ?
					this.props.fileLinkPrefix + e.name :
					null;
				rows.push(<FileTableRow
					entry={e} key={e.name} showSize={this.props.showSize}
					url={url}
					selected={this.isSelected(e.name)}
					onSelected={this.props.onSelected && this.onSelect || null}
				/>);
			});
		}
		return (
			<table className="fileTable">
				<Header {...this.props} selectedAll={this.state.selectedAll}
					onSelected={this.props.onSelected && this.onSelectAll || null} />
				<tbody>
					{rows}
				</tbody>
			</table>
		);
	}

	private isSelected(name: string): boolean {
		return this.props.selected &&
			this.props.selected.findIndex(e => e.name == name) > -1;
	}

	@boundMethod
	private onSelectAll() {
		const select = !this.state.selectedAll;
		const selected = select ?
			this.props.listing.slice() :
			[];
		this.setState({selectedAll: select})
		this.callbackSelected(selected);
	}

	@boundMethod
	private onSelect(e: React.ChangeEvent<HTMLInputElement>): void {
		this.select(e.target.name);
	}

	private select(name: string): void {
		const { listing, selected } = this.props;
		const idx: number = selected.findIndex(e => e.name == name);
		if (idx == -1) {
			selected.push(listing.find(e => e.name == name));
		} else {
			selected.splice(idx, 1);
		}
		this.callbackSelected(selected);
	}

	private callbackSelected(entries: FileTableEntry[]) {
		if (this.props.onSelected)
			this.props.onSelected(entries);
	}
}

interface HeaderProps extends FileTableProps {
	selectedAll: boolean,
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
					{this.props.onSelected && <input name="selectAll" type="checkbox"
						checked={this.props.selectedAll}
						onChange={this.props.onSelected} />}
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
	const sortedBy: boolean = props.sort && props.sort.field == props.field;
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
	onSelected: (e: React.ChangeEvent<HTMLInputElement>) => void,
	url?: string
}

class FileTableRow extends PureComponent<FileTableRowProps> {
	render() {
		const props = this.props;
		let nameTd: JSX.Element
		if (props.url != null) {
			nameTd = (<td><a className="fileTable__fileLink"
				href={props.url}>{props.entry.name}</a></td>);
		} else {
			nameTd = <td>{props.entry.name}</td>;
		}
		let sizeTd = null;
		if (props.showSize)
			sizeTd = (<td>{formatSize(props.entry.size)}</td>);
		const date = new Date(props.entry.mtime * 1000);
		return (<tr>
			<td>
				{props.onSelected && <input name={props.entry.name} type="checkbox"
					checked={props.selected}
					onChange={props.onSelected} />}
			</td>
			{nameTd}
			{sizeTd}
			<td>{formatDate(date)}</td>
		</tr>);
	}
};
