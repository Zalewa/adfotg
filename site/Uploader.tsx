import * as React from 'react';
import { Component } from 'react';
import Dropzone from 'react-dropzone';
import * as request from 'superagent';
import { boundMethod } from 'autobind-decorator';

import { Actions, ActionSet } from './Actions';
import FileTable, { FileTableEntry, Field, Sort, createSort } from './FileTable';
import Listing from './Listing';
import { ConfirmModal } from './Modal';
import { Notification, Note, NoteType, dispatchApiErrors,
	dispatchRequestError } from './Notifier';
import Section from './Section';
import { DeleteButton, Loader } from './ui';


interface UploaderProps {
	onUpload?: () => void
	onSelected?: (entries: FileTableEntry[]) => void
	actions?: JSX.Element[]
}

interface UploaderState {
	listing: FileTableEntry[]
	selection: FileTableEntry[]
	sort: Sort
	deleteSelected: boolean
}

export default class Uploader extends Component<UploaderProps, UploaderState> {
	state: Readonly<UploaderState> = {
		listing: [],
		sort: createSort(Field.Mtime),
		selection: [],
		deleteSelected: false,
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
			{this.renderLeftActions()}
			<ActionSet right={true}>
				<DeleteButton
					disabled={this.state.selection.length == 0}
					onClick={() => this.setState({deleteSelected: true})} />
			</ActionSet>
		</Actions>);
	}

	private renderLeftActions(): JSX.Element {
		if (this.props.actions) {
			return (<ActionSet>
				{this.props.actions}
			</ActionSet>);
		}
		return null;
	}

	private renderDeleteSelected(): JSX.Element {
		return (<ConfirmModal text="Delete these uploads?"
				onAccept={this.deleteSelected}
				onCancel={() => this.setState({deleteSelected: false})}
				acceptText="Delete"
				acceptClass="button--delete">
			<Listing listing={this.state.selection.map(e => e.name)} />
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
	private onSelected(entries: FileTableEntry[]): void {
		this.setState({selection: entries});
		if (this.props.onSelected)
			this.props.onSelected(entries);
	}

	@boundMethod
	private onUpload(): void {
		this.refreshUploads(this.state.sort);
		if (this.props.onUpload)
			this.props.onUpload();
	}

	@boundMethod
	private deleteSelected() {
		request.delete("/upload")
			.send({names: this.state.selection.map(e => e.name)})
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

interface UploadZoneProps {
	onUpload: () => void;
}

interface UploadZoneState {
	uploading: boolean
	uploadSuccess: boolean | null
}

class UploadZone extends Component<UploadZoneProps, UploadZoneState> {
	readonly state: UploadZoneState = {
		uploading: false,
		uploadSuccess: null
	};

	private resetTimer?: ReturnType<typeof setTimeout>;

	render() {
		return (
			<div className="uploadzone">
				<div className="uploadzone__pane">
					<div className="uploadzone__group">
						{!this.state.uploading && this.renderDropZone()}
						{this.state.uploading && <Loader classMod="loader--upload" />}
					</div>
					{this.state.uploadSuccess !== null && this.renderUploadDoneNotifier()}
				</div>
			</div>
		);
	}

	private renderDropZone(): JSX.Element {
		return (<Dropzone onDrop={this.onDrop}
			className="uploadzone__uploadarea"
			acceptClassName="uploadzone__uploadarea--accept"
			rejectClassName="uplaodzone__uplaodarea--reject">
				<div>Drag & drop or click to select files to upload.</div>
		</Dropzone>);
	}

	private renderUploadDoneNotifier(): JSX.Element {
		const note: Note = this.state.uploadSuccess ?
			{type: NoteType.Success, message: "Upload done!"} :
			{type: NoteType.Error, message: "Upload failed!"};
		return (<div className="uploadzone__group">
			<Notification note={note} />
		</div>)
	}

	@boundMethod
	onDrop(accepted: File[], rejected: File[]): void {
		this.setState({uploading: true, uploadSuccess: null});
		const req = request.post('/upload');
		accepted.forEach(file => {
			req.attach(file.name, file);
		});
		req.end((err, res) => {
			this.setState({uploading: false, uploadSuccess: !err});
			dispatchRequestError(err);
			if (!err) {
				this.props.onUpload();
			}
			this.triggerReset();
		});
	}

	private triggerReset(): void {
		if (this.resetTimer !== null) {
			clearTimeout(this.resetTimer);
		}
		this.resetTimer = setTimeout(() => {
			this.resetTimer = null;
			this.setState({uploadSuccess: null});
		}, 1000);
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
