import * as React from 'react';
import { Component } from 'react';
import Dropzone from 'react-dropzone';
import * as request from 'superagent';

import FileTable, { FileTableEntry } from './FileTable';
import { dispatchRequestError } from './Notifier';

interface UploaderState {
	listing: FileTableEntry[]
}

export default class Uploader extends Component<{}, UploaderState> {
	state: Readonly<UploaderState> = {
		listing: []
	}

	render() {
		return (
			<div className="uploader">
				<UploadZone onUpload={() => this.refreshUploads()} />
				<Lister listing={this.state.listing} />
			</div>
		);
	}

	componentDidMount() {
		this.refreshUploads();
	}

	refreshUploads() {
		request.get('/upload').end((err, res) => {
			if (res.error) {
				dispatchRequestError(res.error);
			} else {
				this.setState({
					listing: res.body
				});
			}
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
		return <FileTable {...this.props} />
	}
}
