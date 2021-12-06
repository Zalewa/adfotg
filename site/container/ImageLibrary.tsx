import { Component, ReactNode } from 'react';
import * as request from 'superagent';
import { boundMethod } from 'autobind-decorator';

import { FileTableEntry, } from '../component/FileTable';
import { AdfTable } from '../component/StorageTables';
import { CreateMountImage } from './Mount';
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
				onSelected={this.onImagesSelected}
				onRenderFileActions={this.renderFileActions}
			/>
		</Section>);
	}

	private renderActions(): ReactNode {
		return (
			<Button onClick={this.showCreateImage}
				disabled={this.state.selection.length == 0}
				title="Create Mount Image" />
		);
	}

	private renderModal(): JSX.Element {
		if (this.state.createImage) {
			return <Modal onClose={() => this.setState({createImage: false})}>
				<CreateMountImage adfs={this.state.selection.map(e => e.name)}
					onDone={this.onModalAccepted} />
			</Modal>
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
}
