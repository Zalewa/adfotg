import * as React from 'react';
import { Component } from 'react';
import * as request from 'superagent';
import { boundMethod } from 'autobind-decorator';

import FileTable, { FileTableEntry, Field, Sort, createSort }
	from './FileTable';
import { dispatchRequestError } from './Notifier';
import { ErrorLabel } from './ui';


const enum MountStatus {
	Mounted = "mounted",
	Unmounted = "unmounted",
	NoImage = "noimage",
	BadImage = "badimage"
}

interface MountProps {
	refresh: boolean
}

interface MountState {
	mountStatus: MountStatus,
	error?: string,
	mountedImageName: string,
	imageContentsListing: string[],
	imagesListing: FileTableEntry[],
	imagesSelection: string[],
	sortImages: Sort
}

export default class Mount extends Component<MountProps, MountState> {
	readonly state: MountState = {
		mountStatus: null,
		error: null,
		mountedImageName: "",
		imageContentsListing: [],
		imagesListing: [],
		imagesSelection: [],
		sortImages: createSort(Field.Name)
	}

	render() {
		return (<div className="mount">
			<MountStatusDisplay {...this.state} />
			<span className="mount__imageName">{this.state.mountedImageName}</span>
			<Listing listing={this.state.imageContentsListing} />
			<MountActions mountStatus={this.state.mountStatus}
				images={this.state.imagesSelection}
				onMount={this.mount}
				onUnmount={this.unmount}
				/>
			<FileTable listing={this.state.imagesListing}
				onHeaderClick={this.onImagesHeaderClick}
				sort={this.state.sortImages}
				fileLinkPrefix="/mount_image/"
				onSelected={this.onImagesSelected}
				/>
		</div>);
	}

	componentDidMount() {
		this.refresh();
		this.refreshImages(this.state.sortImages);
	}

	componentWillReceiveProps(props: MountProps) {
		if (this.props.refresh !== props.refresh) {
			this.refresh();
		}
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
		this.refreshImages(this.state.sortImages);
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
	private mount(image: string): void {
		request.post("/mount/" + image).end((err, res) => {
			if (res.error) {
				dispatchRequestError(res.error);
			}
			this.refresh();
		});
	}

	@boundMethod
	private unmount(): void {
		request.post("/unmount").end((err, res) => {
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

	@boundMethod
	private onImagesSelected(images: string[]) {
		this.setState({imagesSelection: images});
	}
}

export interface CreateMountImageProps {
	adfs: string[],
	onDone?: ()=>void
}

interface CreateMountImageState {
	error: Error,
	imageName: string
}

export class CreateMountImage extends React.Component<CreateMountImageProps, CreateMountImageState> {
	readonly state: CreateMountImageState = {
		error: null,
		imageName: ""
	}

	render() {
		return (<div className="createMountImage">
			<span>Create Mount Image with following ADFs:</span>
			<Listing listing={this.sortedAdfs()} />
			<input autoFocus type="text" value={this.state.imageName}
				onChange={e => this.onNameChange(e.target.value)}
				onKeyPress={e => {
					if (e.key === "Enter") {
						this.create();
					}
				}} />
			<input type="button" value="Create" onClick={this.create}
				disabled={this.state.imageName.length == 0} />
			{this.errorWidget()}
		</div>);
	}

	private sortedAdfs(): string[] {
		let cloned = this.props.adfs.slice(0);
		cloned.sort((a: string, b: string) => a.localeCompare(b));
		return cloned;
	}

	private errorWidget(): JSX.Element {
		if (this.state.error) {
			return <ErrorLabel error={this.state.error} />;
		}
		return null;
	}

	@boundMethod
	private create(): void {
		if (!this.state.imageName)
			return;
		request.put("/mount_image/" + this.state.imageName + "/pack_adfs")
			.send({adfs: this.sortedAdfs()})
			.end((err, res) => {
				if (err) {
					this.setState({error: err});
				} else {
					if (this.props.onDone)
						this.props.onDone();
				}
			});
	}

	@boundMethod
	private onNameChange(value: string): void {
		this.setState({imageName: value});
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
	images: string[],
	mountStatus: MountStatus,
	onMount: (image: string)=>void,
	onUnmount: ()=>void,
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
			<button key="unmount" onClick={this.props.onUnmount}>Unmount</button>,
		];
	}

	private unmountedActions(): JSX.Element[] {
		return [
			<button key="mount"
				onClick={() => this.props.onMount(this.props.images[0])}
				disabled={this.props.images.length != 1}>Mount</button>
		];
	}

	private noImageActions(): JSX.Element[] {
		return [
			<button key="unmount" onClick={this.props.onUnmount}>Force Unmount</button>
		]
	}

	private badImageActions(): JSX.Element[] {
		return [];
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
