import * as React from 'react';
import { Component } from 'react';
import * as request from 'superagent';
import { boundMethod } from 'autobind-decorator';

import { Actions, ActionSet } from './Actions';
import FileTable, { FileTableEntry, Field, Sort, createSort,
	RefreshParams }
	from './FileTable';
import Listing from './Listing';
import Modal, { ConfirmModal } from './Modal';
import { CreateMountImage } from './Mount';
import { dispatchApiErrors, dispatchRequestError } from './Notifier';
import Pager, { Page } from './Pager';
import Section from './Section';
import * as res from './res';
import { DeleteButton, Icon } from './ui';

interface ImageLibraryProps {
	onCreatedImage: ()=>void
	onMountedImage: ()=>void
	refresh: boolean
	search: string
}

interface ImageLibraryState {
	createImage: boolean
	listing: FileTableEntry[]
	listingTotal: number
	sort: Sort
	selection: FileTableEntry[]
	deleteSelected: boolean
	page: Page
}

const PAGE_SIZE = 50;

export default class ImageLibrary extends Component<ImageLibraryProps, ImageLibraryState> {
	state: Readonly<ImageLibraryState> = {
		createImage: false,
		listing: [],
		listingTotal: 0,
		sort: createSort(Field.Name),
		selection: [],
		deleteSelected: false,
		page: new Page(0, PAGE_SIZE),
	}

	render() {
		return (<Section title="ADFs" className="imageLibrary">
			{this.renderModal()}
			{this.renderActions()}
			<FileTable listing={this.state.listing}
				showSize={false} onHeaderClick={this.onHeaderClick}
				selected={this.state.selection}
				onSelected={this.onImagesSelected}
				sort={this.state.sort} fileLinkPrefix="/adf/"
				renderFileActions={this.renderFileActions} />
			<Pager page={this.state.page} total={this.state.listingTotal}
				onPageChanged={page => this.refresh({page})} />
		</Section>);
	}

	componentDidMount() {
		this.refresh();
	}

	componentWillReceiveProps(props: ImageLibraryProps) {
		if (this.props.refresh !== props.refresh || this.props.search !== props.search) {
			this.refresh({search: props.search});
		}
	}

	private renderActions(): JSX.Element {
		return (<Actions>
			<ActionSet>
				<button onClick={this.showCreateImage} className="button"
					disabled={this.state.selection.length == 0}>Create Mount Image</button>
			</ActionSet>
			<ActionSet right={true}>
				<DeleteButton
					disabled={this.state.selection.length == 0}
					onClick={() => this.setState({deleteSelected: true})} />
			</ActionSet>
		</Actions>);
	}

	private renderModal(): JSX.Element {
		if (this.state.createImage) {
			return <Modal onClose={() => this.setState({createImage: false})}>
				<CreateMountImage adfs={this.state.selection.map(e => e.name)}
					onDone={this.onModalAccepted} />
			</Modal>
		} else if (this.state.deleteSelected) {
			return (<ConfirmModal text="Delete these ADFs?"
					onAccept={this.deleteSelected}
					onCancel={() => this.setState({deleteSelected: false})}
					acceptText="Delete"
					acceptClass="button--delete">
				<Listing listing={this.state.selection.map(e => e.name)} />
			</ConfirmModal>)
		}
		return null;
	}

	@boundMethod
	private renderFileActions(file: FileTableEntry): JSX.Element {
		return (<button className="button button--table button--icon-table"
					onClick={() => this.quickMount(file.name)}>
			<Icon table button title="Quick Mount" src={res.usb_icon_horz} />
		</button>);
	}

	@boundMethod
	private quickMount(file: string): void {
		request.post('/adf/' + file + '/quickmount').end((err, res) => {
			dispatchRequestError(err);
			if (!err && this.props.onMountedImage) {
				this.props.onMountedImage();
			}
		});
	}

	@boundMethod
	private onHeaderClick(field: Field) {
		this.refresh({sort: createSort(field, this.state.sort)});
	}

	@boundMethod
	private onImagesSelected(entries: FileTableEntry[]) {
		this.setState({selection: entries});
	}

	@boundMethod
	private showCreateImage(): void {
		this.setState({createImage: true});
	}

	@boundMethod
	private onModalAccepted(): void {
		this.props.onCreatedImage();
		this.setState({createImage: false});
	}

	@boundMethod
	private deleteSelected() {
		request.delete("/adf")
			.send({names: this.state.selection.map(e => e.name)})
			.end((err, res) => {
				dispatchRequestError(err);
				if (res.body)
					dispatchApiErrors('Delete ADFs', res.body);
				this.setState({selection: [], deleteSelected: false})
				this.refresh();
			});
	}

	private refresh(args?: RefreshParams): void {
		args = args || {};
		const sort = args.sort || this.state.sort;
		const page = args.page || this.state.page;
		const search = (args.search !== undefined && args.search !== null)
					 ? args.search : this.props.search;
		request.get("/adf").query({
			filter: search,
			sort: sort.field,
			dir: sort.ascending ? 'asc' : 'desc',
			start: page.start,
			limit: page.limit
		}).end((err, res) => {
			dispatchRequestError(err);
			let listing: FileTableEntry[] = [];
			let listingTotal: number = 0;
			if (!err) {
				listing = res.body.listing;
				listingTotal = res.body.total;
			}
			this.setState({listing, listingTotal, sort, page});
			if (page.start != 0 && page.start > listingTotal)
				this.refresh({page: new Page(0, page.limit)});
		})
	}
}
