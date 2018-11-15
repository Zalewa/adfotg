import * as React from 'react';
import { Component } from 'react';
import Dropzone from 'react-dropzone';
import * as request from 'superagent';

interface UploaderState {
	listing: any[]
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
		const req = request.get('/upload');
		req.end((err, res) => {
			this.setState({
				listing: res.body
			})
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
		console.log(accepted);
		console.log(rejected);
		const req = request.post('/upload');
		accepted.forEach(file => {
			req.attach(file.name, file);
		});
		req.end((err, res) => {
			console.log("DONE", err, res);
			this.props.onUpload();
		});
	}
}

class ListerProps {
	listing: any[]
}

class Lister extends Component<ListerProps> {
	render() {
		console.log("listing", this.props.listing);
		var rows: JSX.Element[] = [];
		this.props.listing.forEach((e: ListerEntryProps) => {
			rows.push(<ListerEntry {...e} key={e.name} />);
		});
		return (
			<table className="lister">
				<tbody>
					{rows}
				</tbody>
			</table>
		);
	}

	componentDidMount() {
		console.log("Lister did mount");
	}
}

interface ListerEntryProps {
	name: string,
	mtime: number,
	size: number;
}

const ListerEntry = (props: ListerEntryProps) => {
	return <tr>
		<td>{props.name}</td>
		<td>{props.size}</td>
		<td>{props.mtime}</td>
	</tr>
};
