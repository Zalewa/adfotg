import * as React from 'react';
import { Component } from 'react';
import Dropzone from 'react-dropzone';
import * as request from 'superagent';
import { boundMethod } from 'autobind-decorator';

import FileTable, { FileTableEntry, Field, Sort, createSort } from './FileTable';
import { dispatchRequestError } from './Notifier';


interface UploaderProps {
	onUpload: () => void
}

interface UploaderState {
	listing: FileTableEntry[]
	sort: Sort
}

export default class Uploader extends Component<UploaderProps, UploaderState> {
	state: Readonly<UploaderState> = {
		listing: [],
		sort: createSort(Field.Mtime)
	}

	render() {
		return (
			<div className="uploader">
				<UploadZone onUpload={this.onUpload} />
				<FileTable listing={this.state.listing}
					fileLinkPrefix="/upload/"
					onHeaderClick={this.onHeaderClick}
					sort={this.state.sort} />
			</div>
		);
	}

	componentDidMount() {
		this.refreshUploads(this.state.sort);
	}

	@boundMethod
	private onHeaderClick(field: Field): void {
		this.refreshUploads(createSort(field, this.state.sort));
	}

	@boundMethod
	private onUpload(): void {
		this.refreshUploads(this.state.sort);
		this.props.onUpload();
	}

	private refreshUploads(sort: Sort) {
		request.get('/upload').query({
			sort: sort.field,
			dir: sort.ascending ? "asc" : "desc"
		}).end((err, res) => {
			dispatchRequestError(err);
			let listing: FileTableEntry[] = [];
			if (!err) {
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
				<Dropzone onDrop={this.onDrop}>
					<div>Drag & drop or click to select files to upload.</div>
				</Dropzone>
			</div>
		);
	}

	@boundMethod
	onDrop(accepted: File[], rejected: File[]): void {
		const req = request.post('/upload');
		accepted.forEach(file => {
			req.attach(file.name, file);
		});
		req.end((err, res) => {
			dispatchRequestError(err);
			if (!err) {
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
