import * as React from 'react';
import { Component } from 'react';
import * as request from 'superagent';

import FileTable, { FileTableEntry, Field, Sort, createSort }
	from './FileTable';
import { dispatchRequestError } from './Notifier';

interface ImageLibraryState {
	listing: FileTableEntry[],
	sort: Sort
}

export default class ImageLibrary extends Component<{}, ImageLibraryState> {
	state: Readonly<ImageLibraryState> = {
		listing: [],
		sort: createSort(Field.Name)
	}

	render() {
		const onHeaderClick: (field: Field) => void = this.onHeaderClick.bind(this);
		return (<div><FileTable listing={this.state.listing}
			showSize={false} onHeaderClick={onHeaderClick}
			sort={this.state.sort} fileLinkPrefix="/adf/" /></div>);
	}

	componentDidMount() {
		this.refresh(this.state.sort);
	}

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
