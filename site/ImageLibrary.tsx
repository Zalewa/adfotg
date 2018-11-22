import * as React from 'react';
import { Component } from 'react';
import * as request from 'superagent';
import { boundMethod } from 'autobind-decorator';

import FileTable, { FileTableEntry, Field, Sort, createSort }
	from './FileTable';
import { CreateMountImage } from './Mount';
import { dispatchRequestError } from './Notifier';
import Modal from './Modal';
import Section from './Section';

interface ImageLibraryProps {
	onCreatedImage: ()=>void,
	refresh: boolean
}

interface ImageLibraryState {
	createImage: boolean,
	listing: FileTableEntry[],
	selection: string[],
	sort: Sort
}

export default class ImageLibrary extends Component<ImageLibraryProps, ImageLibraryState> {
	state: Readonly<ImageLibraryState> = {
		createImage: false,
		listing: [],
		selection: [],
		sort: createSort(Field.Name)
	}

	render() {
		return (<Section title="ADFs" className="imageLibrary">
			{this.modal()}
			<button onClick={this.showCreateImage}
				disabled={this.state.selection.length == 0}>Create Mount Image</button>
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

	private modal(): JSX.Element {
		if (this.state.createImage) {
			return <Modal onClose={() => this.setState({createImage: false})}>
				<CreateMountImage adfs={this.state.selection}
					onDone={this.onModalAccepted} />
			</Modal>
		}
		return null;
	}

	@boundMethod
	private onModalAccepted(): void {
		this.props.onCreatedImage();
		this.setState({createImage: false});
	}

	private refresh(sort?: Sort): void {
		if (!sort) {
			sort = this.state.sort;
		}
		request.get("/adf").query({
			filter: '',
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
