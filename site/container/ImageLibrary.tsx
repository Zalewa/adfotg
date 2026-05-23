import { Component, type ReactNode } from 'react';
import * as request from 'superagent';

import { type FileTableEntry } from '../component/FileTable';
import { AdfTable } from './StorageTables';
import CreateMountImage from './CreateMountImage';
import { dispatchRequestError } from '../component/Notifier';
import * as res from '../res';
import { Button } from '../ui/Button';
import Modal from '../ui/Modal';
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
	refresh: number
}

const PAGE_SIZE = 50;

export default class ImageLibrary extends Component<ImageLibraryProps, ImageLibraryState> {
	state: Readonly<ImageLibraryState> = {
		createImage: false,
		selection: [],
		refresh: 0,
	}

	render() {
		return (<Section title="ADFs">
			{this.renderModal()}
			<AdfTable
				actions={this.renderActions()}
				search={this.props.search}
				refresh={this.state.refresh}
				pageSize={PAGE_SIZE}
				selected={this.state.selection}
				onSelected={this.onImagesSelected.bind(this)}
				onRenderFileActions={this.renderFileActions.bind(this)}
			/>
		</Section>);
	}

	private renderActions(): ReactNode {
		return (
			<Button onClick={this.showCreateImage.bind(this)}
				disabled={this.state.selection.length == 0}
				title="Create Mount Image" />
		);
	}

	private renderModal(): ReactNode {
		if (this.state.createImage) {
			return <Modal onClose={() => this.setState({createImage: false})}>
				<CreateMountImage adfs={this.state.selection.map(e => e.name)}
					onDone={this.onModalAccepted.bind(this)} />
			</Modal>
		}
		return null;
	}

	private renderFileActions(file: FileTableEntry): ReactNode {
		const quickMount = this.quickMount.bind(this)
		return (<Button table title="Quick mount" icon={res.usb_icon_horz}
			onClick={() => quickMount(file.name)} />)
	}

	private quickMount(file: string): void {
		request.post("/api/quickmount/adf/" + file).end((err) => {
			dispatchRequestError(err);
			if (!err && this.props.onMountedImage) {
				this.props.onMountedImage();
			}
		});
	}

	private onImagesSelected(entries: FileTableEntry[]) {
		this.setState({selection: entries});
	}

	private showCreateImage(): void {
		this.setState({createImage: true});
	}

	private onModalAccepted(): void {
		this.props.onCreatedImage();
		this.setState({createImage: false});
	}
}
