import * as React from 'react';
import { Component, PureComponent } from 'react';
import { boundMethod } from 'autobind-decorator';

import { ActionSet } from './Actions';
import { CheckBox, LinkText, formatDate, formatSize } from './ui';
import { Page } from './Pager';

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
	private onSelect(name: string): void {
		this.select(name);
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
		let sizeTd = null;
		if (this.props.showSize)
			sizeTd = (<HeaderCell {...this.props} field={Field.Size} label="Size" modifier="fixed-short" />);
		return (<thead>
			<tr className="table__header">
				{this.props.onSelected &&
				<th className="table__header-cell table__header-cell--select">
					<div className="table__cell-contents">
						<CheckBox checked={this.props.selectedAll}
							onClick={this.props.onSelected} />
					</div>
				</th>}
				<HeaderCell {...this.props} field={Field.Name} label="Name" />
				{sizeTd}
				<HeaderCell {...this.props} field={Field.Mtime} label="Modified Date" rightmost modifier="fixed" />
			</tr>
		</thead>);
	}
}

// Such inheritance is a code-smell, but done so regardless
// because it's convenient.
interface HeaderCellProps extends FileTableProps {
	field: Field,
	label: string,
	onHeaderClick?: (field: Field) => void
	rightmost?: boolean
	modifier?: string
}

const HeaderCell = (props: HeaderCellProps) => {
	let klass = "table__header-cell";
	if (props.rightmost)
		klass += " table__header-cell--right";
	if (props.modifier)
		klass += " table__header-cell--" + props.modifier;
	const sortedBy: boolean = props.sort && props.sort.field == props.field;
	if (sortedBy) {
		if (props.sort.ascending)
			klass += " table__header-cell--sorted-asc";
		else
			klass += " table__header-cell--sorted-desc";
	}
	let label: JSX.Element;
	if (props.onHeaderClick) {
		label = <LinkText className="link--table" onClick={() => props.onHeaderClick(props.field)}>{props.label}</LinkText>;
	} else {
		label = <span>{props.label}</span>
	}
	return <th className={klass}>{label}</th>
}

interface FileTableRowProps {
	entry: FileTableEntry,
	showSize: boolean,
	selected: boolean,
	onSelected: (name: string) => void,
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
				<div className="table__cell-contents">
					<CheckBox name={props.entry.name}
						checked={props.selected}
						onClick={props.onSelected} />
				</div>
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

export interface RefreshParams {
	sort?: Sort
	page?: Page
	search?: string
}

/*
TODO This is a failed attempt at code deduplication.
Filtering method is the same in both ADF and Mount Image tables.
I couldn't immediately figure out common code. I should
return to this sometime later.

interface QueryArgs {
	sort: string
	dir: string
	search: string
	start: number
	limit: number
}

class RefreshParams {
	sort?: Sort
	page?: Page
	search?: string

	constructor(sort?: Sort, page?: Page, search?: string) {
		const PAGE_SIZE = 50;

		this.sort = sort || createSort(Field.Name);
		this.page = page || new Page(0, PAGE_SIZE);
		this.search = search;
	}

	toQueryArgs(): QueryArgs {
		return {
			sort: sort.field,
			dir: sort.ascending ? "asc" : "desc",
			search: this.search;
			start: page.start,
			limit: page.limit
		}
	}
}
*/
