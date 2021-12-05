import { Component } from 'react';
import * as request from 'superagent';
import { boundMethod } from 'autobind-decorator';

import { Actions, ActionSet } from '../component/Actions';
import { FileTableEntry, } from '../component/FileTable';
import { AdfTable } from '../component/FileTables';
import List from '../ui/List';
import { CreateMountImage } from './Mount';
import { dispatchApiErrors, dispatchRequestError } from '../component/Notifier';
import * as res from '../res';
import { Button } from '../ui/Button';
import Modal, { ConfirmModal } from '../ui/Modal';
import { Section } from '../ui/Section';

interface ImageLibraryProps {
	onCreatedImage: ()=>void
	onMountedImage: ()=>void
	refresh: boolean
	search: string
}

interface ImageLibraryState {
	createImage: boolean
	selection: FileTableEntry[]
	deleteSelected: boolean
	refresh: number
}

const PAGE_SIZE = 50;

export default class ImageLibrary extends Component<ImageLibraryProps, ImageLibraryState> {
	state: Readonly<ImageLibraryState> = {
		createImage: false,
		selection: [],
		deleteSelected: false,
		refresh: 0,
	}

	render() {
		return (<Section title="ADFs">
			{this.renderModal()}
			{this.renderActions()}
			<AdfTable
				search={this.props.search}
				refresh={this.state.refresh}
				pageSize={PAGE_SIZE}
				selected={this.state.selection}
				onSelected={this.onImagesSelected}
				onRenderFileActions={this.renderFileActions}
			/>
		</Section>);
	}

	private renderActions(): JSX.Element {
		return (<Actions>
			<ActionSet>
				<Button onClick={this.showCreateImage}
					disabled={this.state.selection.length == 0}
					title="Create Mount Image" />
			</ActionSet>
			<ActionSet right={true}>
				<Button purpose="delete"
					disabled={this.state.selection.length == 0}
					onClick={() => this.setState({deleteSelected: true})} />
			</ActionSet>
		</Actions>);
	}

	private renderModal(): JSX.Element {
		if (this.state.createImage) {
			return <Modal onClose={() => this.setState({createImage: false})}>
				<CreateMountImage adfs={this.state.selection.map(e => e.name)}
					onDone={this.onModalAccepted} />
			</Modal>
		} else if (this.state.deleteSelected) {
			return (<ConfirmModal text="Delete these ADFs?"
					onAccept={this.deleteSelected}
					onCancel={() => this.setState({deleteSelected: false})}
					acceptText="Delete"
					acceptPurpose="delete">
				<List listing={this.state.selection.map(e => e.name)} />
			</ConfirmModal>)
		}
		return null;
	}

	@boundMethod
	private renderFileActions(file: FileTableEntry): JSX.Element {
		return (<Button table title="Quick mount" icon={res.usb_icon_horz}
			onClick={() => this.quickMount(file.name)} />)
	}

	@boundMethod
	private quickMount(file: string): void {
		request.post("/api/quickmount/adf/" + file).end((err, res) => {
			dispatchRequestError(err);
			if (!err && this.props.onMountedImage) {
				this.props.onMountedImage();
			}
		});
	}

	@boundMethod
	private onImagesSelected(entries: FileTableEntry[]) {
		this.setState({selection: entries});
	}

	@boundMethod
	private showCreateImage(): void {
		this.setState({createImage: true});
	}

	@boundMethod
	private onModalAccepted(): void {
		this.props.onCreatedImage();
		this.setState({createImage: false});
	}

	@boundMethod
	private deleteSelected() {
		request.delete("/api/adf/image")
			.send({names: this.state.selection.map(e => e.name)})
			.end((err, res) => {
				dispatchRequestError(err);
				if (res.body)
					dispatchApiErrors('Delete ADFs', res.body);
				this.setState({
					selection: [],
					deleteSelected: false,
					refresh: this.state.refresh + 1,
				})
			});
	}
}
