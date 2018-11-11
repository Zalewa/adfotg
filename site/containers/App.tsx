import * as React from 'react';
import { Component } from 'react';
import Dropzone from 'react-dropzone';
import * as request from 'superagent';

export default class App extends Component {
	render () {
		return (
			<div>
			<Dropzone onDrop={this.onDrop}>
				<div>Try dropping some files here, or click to select files to upload.</div>
			</Dropzone>
			<p>This is my new react app</p></div>);
	}

	onDrop(accepted: File[], rejected: File[]): void {
		console.log(accepted);
		console.log(rejected);
		const req = request.post('/upload');
		accepted.forEach(file => {
			req.attach(file.name, file.name);
		});
		req.end((err, res) => {
			console.log("DONE", err, res);
		});
	}
}
