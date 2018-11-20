import * as React from 'react';
import { Component } from 'react';
import Dropzone from 'react-dropzone';
import * as request from 'superagent';

import FileTable, { FileTableEntry, Field, Sort, createSort } from './FileTable';
import { dispatchRequestError } from './Notifier';

interface UploaderState {
	listing: FileTableEntry[]
	sort: Sort
}

export default class Uploader extends Component<{}, UploaderState> {
	state: Readonly<UploaderState> = {
		listing: [],
		sort: createSort(Field.Mtime)
	}

	render() {
		const onHeaderClick: (field: Field) => void = this.onHeaderClick.bind(this);
		return (
			<div className="uploader">
				<UploadZone onUpload={() => this.refreshUploads(this.state.sort)} />
				<FileTable listing={this.state.listing}
					fileLinkPrefix="upload/"
					onHeaderClick={onHeaderClick} sort={this.state.sort} />
			</div>
		);
	}

	componentDidMount() {
		this.refreshUploads(this.state.sort);
	}

	private onHeaderClick(field: Field) {
		this.refreshUploads(createSort(field, this.state.sort));
	}

	private refreshUploads(sort: Sort) {
		request.get('/upload').query({
			sort: sort.field,
			dir: sort.ascending ? "asc" : "desc"
		}).end((err, res) => {
			let listing: FileTableEntry[] = [];
			if (res.error) {
				dispatchRequestError(res.error);
			} else {
				listing = res.body;
			}
			this.setState({
				listing: res.body,
				sort: sort
			});
		});
	}
}

class UploadZoneProps {
	onUpload: () => void;
}

class UploadZone extends Component<UploadZoneProps> {
	render() {
		return (
			<div className="uploadzone">
				<Dropzone onDrop={this.onDrop.bind(this)}>
					<div>Drag & drop or click to select files to upload.</div>
				</Dropzone>
			</div>
		);
	}

	onDrop(accepted: File[], rejected: File[]): void {
		console.log(accepted); // XXX
		console.log(rejected); // XXX
		const req = request.post('/upload');
		accepted.forEach(file => {
			req.attach(file.name, file);
		});
		req.end((err, res) => {
			console.log("DONE", err, res); // XXX
			if (res.error) {
				dispatchRequestError(res.error);
			} else {
				this.props.onUpload();
			}
		});
	}
}

class ListerProps {
	listing: any[]
}

class Lister extends Component<ListerProps> {
	render() {
		return <FileTable listing={this.props.listing} />
	}
}
