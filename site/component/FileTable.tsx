import { Component, PureComponent, ReactNode } from 'react';
import { boundMethod } from 'autobind-decorator';

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
	showSize: boolean,
	onHeaderClick?: (field: Field) => void,
	onSelected?: (entries: FileTableEntry[]) => void,
	selected: FileTableEntry[],
	sort: Sort,
	fileLinkPrefix?: string
	renderName?: FileRenderFunc
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
			const renderName = this.props.renderName || this.renderEntryUrl;
			this.props.listing.forEach((e: FileTableEntry) => {
				rows.push(<FileTableRow
					entry={e} key={e.name} showSize={this.props.showSize}
					renderName={renderName}
					renderFileActions={this.props.renderFileActions}
					selected={this.isSelected(e.name)}
					onSelected={this.props.onSelected && this.onSelect || null}
				/>);
			});
		}
		return (
			<Table css={{width: "100%"}}>
				<Header {...this.props} selectedAll={this.state.selectedAll}
					onSelected={this.props.onSelected && this.onSelectAll || null} />
				<tbody>
					{rows}
				</tbody>
			</Table>
		);
	}

	@boundMethod
	private renderEntryUrl(entry: FileTableEntry) {
		const url = this.entryUrl(entry);
		if (url != null) {
			return <a css={TableLink} href={url}>{entry.name}</a>;
		} else {
			return <span>{entry.name}</span>;
		}
	}

	private entryUrl(entry: FileTableEntry) {
		let url = null;
		if (this.props.fileLinkPrefix) {
			url = this.props.fileLinkPrefix;
			if (!url.endsWith("/"))
				url += "/";
			url += entry.name;
		}
		return url;
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
			sizeTd = (<HeaderCell {...this.props} field={Field.Size} label="Size" css={{width: "4em"}} />);
		return (<thead>
			<tr>
				{this.props.onSelected &&
				<HeaderSelectCell>
					<CellPane>
						<CheckBox checked={this.props.selectedAll}
							onClick={this.props.onSelected} />
					</CellPane>
				</HeaderSelectCell>}
				<HeaderCell {...this.props} field={Field.Name} label="Name" />
				{sizeTd}
				<HeaderCell {...this.props} field={Field.Mtime} label="Modified Date" rightmost
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
	let label: JSX.Element;
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

class FileTableRow extends PureComponent<FileTableRowProps> {
	render() {
		return (<TableRecord>
			{this.renderSelectCell()}
			{this.renderNameCell()}
			{this.renderSizeCell()}
			{this.renderDateCell()}
		</TableRecord>);
	}

	private renderSelectCell(): JSX.Element {
		const { props } = this;
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

	private renderNameCell(): JSX.Element {
		return (<DataCell>
			<CellPane>
				{this.renderName()}
				{this.renderActions()}
			</CellPane>
		</DataCell>)
	}

	private renderName(): ReactNode {
		return this.props.renderName(this.props.entry);
	}

	private renderSizeCell(): JSX.Element {
		if (this.props.showSize)
			return <DataCell>{formatSize(this.props.entry.size)}</DataCell>;
		return null;
	}

	private renderDateCell(): JSX.Element {
		const date = new Date(this.props.entry.mtime * 1000);
		return <DataCell>{formatDate(date)}</DataCell>
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
