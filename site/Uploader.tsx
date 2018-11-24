import * as React from 'react';
import { Component } from 'react';
import Dropzone from 'react-dropzone';
import * as request from 'superagent';
import { boundMethod } from 'autobind-decorator';

import { Actions, ActionSet } from './Actions';
import FileTable, { FileTableEntry, Field, Sort, createSort } from './FileTable';
import { ConfirmModal } from './Modal';
import { dispatchApiErrors, dispatchRequestError } from './Notifier';
import Section from './Section';
import { DeleteButton, Listing } from './ui';


interface UploaderProps {
	onUpload: () => void
}

interface UploaderState {
	listing: FileTableEntry[]
	sort: Sort
	selection: string[]
	deleteSelected: boolean
}

export default class Uploader extends Component<UploaderProps, UploaderState> {
	state: Readonly<UploaderState> = {
		listing: [],
		sort: createSort(Field.Mtime),
		selection: [],
		deleteSelected: false
	}

	render() {
		return (
			<Section title="Upload Zone" className="uploader">
				{this.state.deleteSelected && this.renderDeleteSelected()}
				<UploadZone onUpload={this.onUpload} />
				{this.renderActions()}
				<FileTable listing={this.state.listing}
					fileLinkPrefix="/upload/"
					onHeaderClick={this.onHeaderClick}
					sort={this.state.sort}
					selected={this.state.selection}
					onSelected={this.onSelected} />
			</Section>
		);
	}

	renderActions(): JSX.Element {
		return (<Actions>
			<ActionSet right={true}>
				<DeleteButton
					disabled={this.state.selection.length == 0}
					onClick={() => this.setState({deleteSelected: true})} />
			</ActionSet>
		</Actions>);
	}

	private renderDeleteSelected(): JSX.Element {
		return (<ConfirmModal text="Delete these uploads?"
				onAccept={this.deleteSelected}
				onCancel={() => this.setState({deleteSelected: false})}
				acceptText="Delete">
			<Listing listing={this.state.selection} />
		</ConfirmModal>)
	}

	componentDidMount() {
		this.refreshUploads(this.state.sort);
	}

	@boundMethod
	private onHeaderClick(field: Field): void {
		this.refreshUploads(createSort(field, this.state.sort));
	}

	@boundMethod
	private onSelected(entries: string[]): void {
		this.setState({selection: entries});
	}

	@boundMethod
	private onUpload(): void {
		this.refreshUploads(this.state.sort);
		this.props.onUpload();
	}

	@boundMethod
	private deleteSelected() {
		request.delete("/upload")
			.send({names: this.state.selection})
			.end((err, res) => {
				dispatchRequestError(err);
				if (res.body)
					dispatchApiErrors('Delete uploads', res.body);
				this.setState({selection: [], deleteSelected: false})
				this.refreshUploads(this.state.sort);
			});
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
				listing: listing,
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
