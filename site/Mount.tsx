import * as React from 'react';
import { Component } from 'react';
import * as request from 'superagent';
import { boundMethod } from 'autobind-decorator';

import FileTable, { FileTableEntry, Field, Sort, createSort }
from './FileTable';
import { dispatchRequestError } from './Notifier';


const enum MountStatus {
	Mounted = "mounted",
	Unmounted = "unmounted",
	NoImage = "noimage",
	BadImage = "badimage"
}

interface MountState {
	mountStatus: MountStatus,
	error?: string,
	mountedImageName: string,
	imageContentsListing: string[],
	imagesListing: FileTableEntry[],
	sortImages: Sort
}

export default class Mount extends Component<{}, MountState> {
	readonly state: MountState = {
		mountStatus: null,
		error: null,
		mountedImageName: "",
		imageContentsListing: [],
		imagesListing: [],
		sortImages: createSort(Field.Name)
	}

	render() {
		return (<div className="mount">
			<MountStatusDisplay {...this.state} />
			<span className="mount__imageName">{this.state.mountedImageName}</span>
			<Listing listing={this.state.imageContentsListing} />
			<MountActions mountStatus={this.state.mountStatus}
				onMount={this.mount}
				onUnmountAndDiscard={this.unmountDiscard}
				onUnmountAndSave={this.unmountSave}
				/>
			<FileTable listing={this.state.imagesListing}
				onHeaderClick={this.onImagesHeaderClick}
				sort={this.state.sortImages}
				fileLinkPrefix="/mount_image/"
				/>
		</div>);
	}

	componentDidMount() {
		this.refresh();
		this.refreshImages(this.state.sortImages);
	}

	private refresh(): void {
		request.get("/mount").end((err, res) => {
			let mountStatus: MountStatus = null;
			if (res.error) {
				dispatchRequestError(res.error);
			} else {
				mountStatus = res.body.status;
			}
			this.setState({
				mountStatus: mountStatus,
				error: err ? err.toString() : res.body.error,
				mountedImageName: res.body.file,
				imageContentsListing: res.body.listing
			});
		})
	}

	private refreshImages(sort: Sort): void {
		request.get("/mount_image").query({
			sort: sort.field,
			dir: sort.ascending ? "asc" : "desc"
		}).end((err, res) => {
			let listing: FileTableEntry[] = [];
			if (res.error) {
				dispatchRequestError(res.error);
			} else {
				listing = res.body;
			}
			this.setState({
				imagesListing: listing,
				sortImages: sort
			})
		})
	}

	@boundMethod
	private mount(): void {
		// TODO we need to pass the selected image to this method somehow
		request.post("/mount")
			.end((err, res) => {
				if (res.error) {
					dispatchRequestError(res.error);
				}
				this.refresh();
			});
	}

	@boundMethod
	private unmountDiscard(): void {
		this.unmount("discard");
	}

	@boundMethod
	private unmountSave(): void {
		this.unmount("save");
	}

	private unmount(how: string): void {
		request.post("/unmount").send({how: how}).end(
			(err, res) => {
				if (res.error) {
					dispatchRequestError(res.error);
				}
				this.refresh();
			});
	}

	@boundMethod
	private onImagesHeaderClick(field: Field) {
		this.refreshImages(createSort(field, this.state.sortImages));
	}
}

export interface CreateMountImageProps {
	adfs: string[]
}

export class CreateMountImage extends React.Component<CreateMountImageProps> {
	render() {
		return (<div className="createMountImage">
			<span>Create Mount Image with following ADFs:</span>
			<Listing listing={this.props.adfs} />
			<input type="text" />
			<input type="button" value="Create" />
		</div>)
	}
}

interface MountStatusProps extends MountState {}

type Display = {
	text: string;
	klass: string;
}

class MountStatusDisplay extends Component<MountStatusProps> {
	render() {
		const display: Display = this.statusDisplay()
		return <div className={"mount__status--" + display.klass}>
			<span>{display.text}</span>
		</div>
	}

	private statusDisplay(): Display {
		switch (this.props.mountStatus) {
			case MountStatus.Mounted:
				return {text: "Mounted", klass: "mounted"};
			case MountStatus.Unmounted:
				return {text: "Not mounted", klass: "unmounted"};
			case MountStatus.NoImage:
				return {text: "No image", klass: "noimage"};
			case MountStatus.BadImage:
				return {text: "Image error: " + this.props.error, klass: "badstatus"};
			default:
				return {text: "Unknown State", klass: "unknown"};
		}
	}
}

interface MountActionsProps {
	mountStatus: MountStatus,
	onMount: ()=>void,
	onUnmountAndDiscard: ()=>void,
	onUnmountAndSave: ()=>void
}

class MountActions extends React.Component<MountActionsProps> {
	render() {
		return (<div className="mount__actions">
			{this.actions()}
		</div>);
	}

	private actions(): JSX.Element[] {
		switch (this.props.mountStatus) {
			case MountStatus.Mounted:
				return this.mountedActions();
			case MountStatus.Unmounted:
				return this.unmountedActions();
			case MountStatus.NoImage:
				return this.noImageActions();
			case MountStatus.BadImage:
				return this.badImageActions();
			default:
				return [];
		}
	}

	private mountedActions(): JSX.Element[] {
		return [
			<button key="unmountsave" onClick={this.props.onUnmountAndSave}>Unmount & Save</button>,
			<button key="unmountdiscard" onClick={this.props.onUnmountAndDiscard}>Unmount & Discard</button>
		];
	}

	private unmountedActions(): JSX.Element[] {
		return [
			<button key="mount" onClick={this.props.onMount}>Mount</button>,
			<button key="save" onClick={this.props.onUnmountAndSave}>Save & Discard</button>,
			this.discardButton()
		];
	}

	private noImageActions(): JSX.Element[] {
		return [
			<button key="mountAdfs" onClick={this.props.onMount}>Mount selected ADFs</button>
		];
	}

	private badImageActions(): JSX.Element[] {
		return [
			this.discardButton()
		];
	}

	private discardButton(): JSX.Element {
		return <button key="discard" onClick={this.props.onUnmountAndDiscard}>Discard</button>
	}
}

class Listing extends Component<{listing: string[]}> {
	render() {
		let lines: JSX.Element[] = []
		if (this.props.listing) {
			this.props.listing.forEach(entry => {
				lines.push(<li key={entry}>{entry}</li>);
			})
		}
		if (lines.length > 0) {
			return (<ul className="mount__listing">
				{lines}
			</ul>);
		} else {
			return null;
		}
	}
}
