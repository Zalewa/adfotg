import * as React from 'react';
import { Component } from 'react';
import * as request from 'superagent';

import FileTable, { FileTableEntry } from './FileTable';
import { dispatchRequestError } from './Notifier';

interface ImageLibraryState {
	listing: FileTableEntry[]
}

export default class ImageLibrary extends Component<{}, ImageLibraryState> {
	state: Readonly<ImageLibraryState> = {
		listing: []
	}

	render() {
		return (<div><FileTable listing={this.state.listing} /></div>);
	}

	componentDidMount() {
		this.refresh();
	}

	private refresh() {
		request.get("/adf").end((err, res) => {
			if (res.error) {
				dispatchRequestError(res.error);
			} else {
				this.setState({
					listing: res.body
				});
			}
		})
	}
}
