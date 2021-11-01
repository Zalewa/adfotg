import * as React from 'react';
import { Component } from 'react';
import * as request from 'superagent';
import { boundMethod } from 'autobind-decorator';

import { Actions, ActionSet } from '../component/Actions';
import FileTable, { FileTableEntry, Field, Sort, createSort,
	RefreshParams }
	from '../component/FileTable';
import Listing from '../component/Listing';
import Modal, { ConfirmModal } from '../component/Modal';
import { CreateMountImage } from './Mount';
import { dispatchApiErrors, dispatchRequestError } from '../component/Notifier';
import Pager, { Page } from '../component/Pager';
import * as res from '../res';
import Section from '../component/Section';
import style from '../style.less';
import { DeleteButton, Icon } from '../component/ui';

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
		return (<Section title="ADFs" className={style.imageLibrary}>
			{this.renderModal()}
			{this.renderActions()}
			<FileTable listing={this.state.listing}
				showSize={false} onHeaderClick={this.onHeaderClick}
				selected={this.state.selection}
				onSelected={this.onImagesSelected}
				sort={this.state.sort} fileLinkPrefix="/api/adf/image"
				renderFileActions={this.renderFileActions} />
			<Pager page={this.state.page} total={this.state.listingTotal}
				onPageChanged={page => this.refresh({page})} />
		</Section>);
	}

	componentDidMount() {
		this.refresh();
	}

	componentDidUpdate(props: ImageLibraryProps) {
		if (this.props.refresh !== props.refresh || this.props.search !== props.search) {
			this.refresh({search: this.props.search});
		}
	}

	private renderActions(): JSX.Element {
		return (<Actions>
			<ActionSet>
				<button onClick={this.showCreateImage} className={style.button}
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
					acceptClass={style.buttonDelete}>
				<Listing listing={this.state.selection.map(e => e.name)} />
			</ConfirmModal>)
		}
		return null;
	}

	@boundMethod
	private renderFileActions(file: FileTableEntry): JSX.Element {
		return (<button className={`${style.button} ${style.buttonTable} ${style.buttonIconTable}`}
					onClick={() => this.quickMount(file.name)}>
			<Icon table button title="Quick Mount" src={res.usb_icon_horz} />
		</button>);
	}

	@boundMethod
	private quickMount(file: string): void {
		request.post("/api/quickmount/adf/" + file).end((err, res) => {
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
		request.delete("/api/adf/image")
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
		request.get("/api/adf/image").query({
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
