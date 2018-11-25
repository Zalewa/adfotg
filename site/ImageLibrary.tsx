import * as React from 'react';
import { Component } from 'react';
import * as request from 'superagent';
import { boundMethod } from 'autobind-decorator';

import { Actions, ActionSet } from './Actions';
import FileTable, { FileTableEntry, Field, Sort, createSort }
from './FileTable';
import Modal, { ConfirmModal } from './Modal';
import { CreateMountImage } from './Mount';
import { dispatchApiErrors, dispatchRequestError } from './Notifier';
import Search from './Search';
import Section from './Section';
import { DeleteButton, Listing } from './ui';

interface ImageLibraryProps {
	onCreatedImage: ()=>void,
	refresh: boolean
}

interface ImageLibraryState {
	createImage: boolean,
	listing: FileTableEntry[],
	sort: Sort,
	selection: string[],
	deleteSelected: boolean,
	search: string
}

export default class ImageLibrary extends Component<ImageLibraryProps, ImageLibraryState> {
	state: Readonly<ImageLibraryState> = {
		createImage: false,
		listing: [],
		sort: createSort(Field.Name),
		selection: [],
		deleteSelected: false,
		search: ''
	}

	render() {
		return (<Section title="ADFs" className="imageLibrary">
			{this.renderModal()}
			{this.renderActions()}
			<Search text={this.state.search} onEdit={this.onSearchEdited}
				onSubmit={this.onSearchSubmitted} />
			<FileTable listing={this.state.listing}
				showSize={false} onHeaderClick={this.onHeaderClick}
				selected={this.state.selection}
				onSelected={this.onImagesSelected}
				sort={this.state.sort} fileLinkPrefix="/adf/" />
		</Section>);
	}

	componentDidMount() {
		this.refresh();
	}

	componentWillReceiveProps(props: ImageLibraryProps) {
		if (this.props.refresh !== props.refresh) {
			this.refresh();
		}
	}

	private renderActions(): JSX.Element {
		return (<Actions>
			<ActionSet>
				<button onClick={this.showCreateImage}
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
				<CreateMountImage adfs={this.state.selection}
					onDone={this.onModalAccepted} />
			</Modal>
		} else if (this.state.deleteSelected) {
			return (<ConfirmModal text="Delete these uploads?"
					onAccept={this.deleteSelected}
					onCancel={() => this.setState({deleteSelected: false})}
					acceptText="Delete">
				<Listing listing={this.state.selection} />
			</ConfirmModal>)
		}
		return null;
	}

	@boundMethod
	private onHeaderClick(field: Field) {
		this.refresh(createSort(field, this.state.sort));
	}

	@boundMethod
	private onImagesSelected(entries: string[]) {
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
	private onSearchEdited(search: string): void {
		this.setState({search});
	}

	@boundMethod
	private onSearchSubmitted(): void {
		this.refresh();
	}

	@boundMethod
	private deleteSelected() {
		request.delete("/adf")
			.send({names: this.state.selection})
			.end((err, res) => {
				dispatchRequestError(err);
				if (res.body)
					dispatchApiErrors('Delete ADFs', res.body);
				this.setState({selection: [], deleteSelected: false})
				this.refresh(this.state.sort);
			});
	}

	private refresh(sort?: Sort): void {
		if (!sort) {
			sort = this.state.sort;
		}
		request.get("/adf").query({
			filter: this.state.search,
			sort: sort.field,
			dir: sort.ascending ? 'asc' : 'desc'
		}).end((err, res) => {
			dispatchRequestError(err);
			let listing: FileTableEntry[] = [];
			if (!err) {
				listing = res.body;
			}
			this.setState({
				listing: listing,
				sort: sort
			});
		})
	}
}
