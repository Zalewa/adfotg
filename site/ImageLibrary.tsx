import * as React from 'react';
import { Component } from 'react';
import * as request from 'superagent';
import { boundMethod } from 'autobind-decorator';

import FileTable, { FileTableEntry, Field, Sort, createSort }
from './FileTable';
import { dispatchRequestError } from './Notifier';

interface ImageLibraryProps {
	onCreateImage: (adfs: string[]) => void,
	refresh: boolean
}

interface ImageLibraryState {
	listing: FileTableEntry[],
	selection: string[],
	sort: Sort
}

export default class ImageLibrary extends Component<ImageLibraryProps, ImageLibraryState> {
	state: Readonly<ImageLibraryState> = {
		listing: [],
		selection: [],
		sort: createSort(Field.Name)
	}

	render() {
		return (<div>
			<button onClick={() => this.props.onCreateImage(this.state.selection)}>Create Mount Image</button>
			<FileTable listing={this.state.listing}
				showSize={false} onHeaderClick={this.onHeaderClick}
				sort={this.state.sort} fileLinkPrefix="/adf/" />
		</div>);
	}

	componentDidMount() {
		this.refresh(this.state.sort);
	}

	componentWillReceiveProps(props: ImageLibraryProps) {
		if (this.props.refresh !== props.refresh) {
			this.refresh(this.state.sort);
		}
	}

	@boundMethod
	private onHeaderClick(field: Field) {
		this.refresh(createSort(field, this.state.sort));
	}

	private refresh(sort: Sort) {
		request.get("/adf").query({
			filter: '',
			sort: sort.field,
			dir: sort.ascending ? 'asc' : 'desc'
		}).end((err, res) => {
			let listing: FileTableEntry[] = [];
			if (res.error) {
				dispatchRequestError(res.error);
			} else {
				listing = res.body;
			}
			this.setState({
				listing: listing,
				sort: sort
			});
		})
	}
}
