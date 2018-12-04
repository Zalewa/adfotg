import * as React from 'react';
import { Component, PureComponent } from 'react';
import { boundMethod } from 'autobind-decorator';

import { ActionSet } from './Actions';
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

type FileRenderFunc = (file: FileTableEntry) => JSX.Element;

interface FileTableProps {
	listing: FileTableEntry[]
	showSize: boolean,
	onHeaderClick?: (field: Field) => void,
	onSelected?: (entries: FileTableEntry[]) => void,
	selected: FileTableEntry[],
	sort: Sort,
	fileLinkPrefix?: string
	renderFileActions?: FileRenderFunc
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
					url={url} renderFileActions={this.props.renderFileActions}
					selected={this.isSelected(e.name)}
					onSelected={this.props.onSelected && this.onSelect || null}
				/>);
			});
		}
		return (
			<table className="table table--full-page">
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
			sizeTd = (<HeaderCell {...headerProps} field={Field.Size} label="Size" fixed />);
		return (<thead>
			<tr className="table__header">
				{this.props.onSelected &&
				<th className="table__header-cell table__header-cell--select">
					<input name="selectAll" type="checkbox"
						checked={this.props.selectedAll}
						onChange={this.props.onSelected} />
				</th>}
				<HeaderCell {...headerProps} field={Field.Name} label="Name" />
				{sizeTd}
				<HeaderCell {...headerProps} field={Field.Mtime} label="Modified Date" rightmost fixed />
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
	rightmost?: boolean
	fixed?: boolean
}

const HeaderCell = (props: HeaderCellProps) => {
	let klass = "table__header-cell";
	if (props.rightmost)
		klass += " table__header-cell--right";
	if (props.fixed)
		klass += " table__header-cell--fixed";
	const sortedBy: boolean = props.sort && props.sort.field == props.field;
	if (sortedBy) {
		if (props.sort.ascending)
			klass += " table__header-cell--sorted-asc";
		else
			klass += " table__header-cell--sorted-desc";
	}
	return <th className={klass}>
		<LinkText className="link--table" onClick={() => props.onHeaderClick(props.field)}>{props.label}</LinkText>
	</th>
}

interface FileTableRowProps {
	entry: FileTableEntry,
	showSize: boolean,
	selected: boolean,
	onSelected: (e: React.ChangeEvent<HTMLInputElement>) => void,
	url?: string
	renderFileActions: FileRenderFunc
}

class FileTableRow extends PureComponent<FileTableRowProps> {
	render() {
		const props = this.props;
		return (<tr className="table__record">
			{this.renderSelectCell()}
			{this.renderNameCell()}
			{this.renderSizeCell()}
			{this.renderDateCell()}
		</tr>);
	}

	private renderSelectCell(): JSX.Element {
		const { props } = this;
		if (props.onSelected) {
			return (<td className="table__data-cell table__data-cell--select">
				<input name={props.entry.name} type="checkbox"
					checked={props.selected}
					onChange={props.onSelected} />
			</td>);
		}
		return null;
	}

	private renderNameCell(): JSX.Element {
		return (<td className="table__data-cell">
			<div className="table__cell-contents">
				{this.renderName()}
				{this.renderActions()}
			</div>
		</td>)
	}

	private renderName(): JSX.Element {
		const { props } = this;
		if (props.url != null) {
			return <a className="link link--table"
				href={props.url}>{props.entry.name}</a>;
		} else {
			return <span>{props.entry.name}</span>;
		}
	}

	private renderSizeCell(): JSX.Element {
		if (this.props.showSize)
			return <td className="table__data-cell">{formatSize(this.props.entry.size)}</td>;
		return null;
	}

	private renderDateCell(): JSX.Element {
		const date = new Date(this.props.entry.mtime * 1000);
		return <td className="table__data-cell">{formatDate(date)}</td>
	}

	private renderActions(): JSX.Element {
		const { props } = this;
		if (props.renderFileActions) {
			return (<ActionSet right>
				{props.renderFileActions(props.entry)}
			</ActionSet>);
		}
		return null;
	}
};
