import { Component, ReactNode } from 'react';
import Dropzone from 'react-dropzone';
import * as request from 'superagent';
import { boundMethod } from 'autobind-decorator';

import { FileTableEntry } from '../component/FileTable';
import { UploadTable } from './StorageTables';
import { Notification, Note, NoteType,
	dispatchRequestError } from '../component/Notifier';
import { Section } from '../ui/Section';
import { Loader } from '../ui/ui';
import * as skin from '../skin';


interface UploaderProps {
	onUpload?: () => void
	selected: FileTableEntry[]
	onSelected: (entries: FileTableEntry[]) => void
	actions?: ReactNode
}

interface UploaderState {
	refresh: number
}

const PAGE_SIZE = 50;

export default class Uploader extends Component<UploaderProps, UploaderState> {
	state: Readonly<UploaderState> = {
		refresh: 0,
	}

	render() {
		return (
			<Section title="Upload Zone" css={{padding: "0 2em 1em 2em"}}>
				<UploadZone onUpload={this.onUpload} />
				<UploadTable
					actions={this.props.actions}
					search={null}
					refresh={this.state.refresh}
					pageSize={PAGE_SIZE}
					selected={this.props.selected}
					onSelected={this.props.onSelected}
				/>
			</Section>
		);
	}

	@boundMethod
	private onUpload(): void {
		this.setState({refresh: this.state.refresh + 1});
		if (this.props.onUpload)
			this.props.onUpload();
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
			<div css={{padding: "0 2em 1em 2em"}}>
				<div css={{width: "100%"}}>
					{!this.state.uploading && this.state.uploadSuccess === null && this.renderDropZone()}
					{this.state.uploading && <Loader css={{width: "100%"}} />}
					{this.state.uploadSuccess !== null && this.renderUploadDoneNotifier()}
				</div>
			</div>
		);
	}

	private renderDropZone(): JSX.Element {
		return (<Dropzone onDropAccepted={this.onDrop}>
			{({getRootProps, getInputProps, isDragAccept, isDragReject}) => {
				return (<div {...getRootProps()}>
					<input {...getInputProps()} />
					<p css={[
						{
							cursor: "pointer",
							padding: "1em 4em",
							border: `0.25em dashed ${skin.page.color}`,
							borderRadius: "0.5em",
							margin: "auto",
							textAlign: "center",
							verticalAlign: "middle",
							"&:hover": {
								backgroundColor: skin.workbench.titleColor,
							}
						},
						isDragAccept && {backgroundColor: skin.workbench.titleColor},
						isDragReject && {backgroundColor: skin.dangerColor},
					]}>
						Drag & drop or click to select files to upload.
					</p>
				</div>);
			}}
		</Dropzone>);
	}

	private renderUploadDoneNotifier(): JSX.Element {
		const note: Note = this.state.uploadSuccess ?
			{type: NoteType.Success, message: "UPLOAD DONE !"} :
			{type: NoteType.Error, message: "UPLOAD FAILED !"};
		return <Notification note={note} css={{fontSize: "2em", textAlign: "center"}} />;
	}

	@boundMethod
	onDrop(accepted: File[]): void {
		this.setState({uploading: true, uploadSuccess: null});
		const req = request.post("/api/upload");
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
		}, 2000);
	}
}
