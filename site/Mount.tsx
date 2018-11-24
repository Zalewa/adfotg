import * as React from 'react';
import { Component } from 'react';
import * as request from 'superagent';
import { boundMethod } from 'autobind-decorator';

import { Actions, ActionSet } from './Actions';
import FileTable, { FileTableEntry, Field, Sort, createSort }
	from './FileTable';
import { ConfirmModal } from './Modal';
import { dispatchApiErrors, dispatchRequestError } from './Notifier';
import Section from './Section';
import { DeleteButton, ErrorLabel, Listing } from './ui';


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
	sortImages: Sort,
	deleteSelected: boolean
}

export default class Mount extends Component<MountProps, MountState> {
	readonly state: MountState = {
		mountStatus: null,
		error: null,
		mountedImageName: "",
		imageContentsListing: [],
		imagesListing: [],
		imagesSelection: [],
		sortImages: createSort(Field.Name),
		deleteSelected: false
	}

	render() {
		return (<Section title="Mounting" className="mount">
			{this.state.deleteSelected && this.renderDeleteSelected()}
			<MountStatusDisplay {...this.state} />
			<span className="mount__imageName">{this.state.mountedImageName}</span>
			<Listing listing={this.state.imageContentsListing} />
			<Actions>
				<ActionSet>
					<MountActions mountStatus={this.state.mountStatus}
						images={this.state.imagesSelection}
						onMount={this.mount}
						onUnmount={this.unmount}
					/>
				</ActionSet>
				<ActionSet right={true}>
					<DeleteButton
						disabled={this.state.imagesSelection.length == 0}
						onClick={() => this.setState({deleteSelected: true})}
					/>
				</ActionSet>
			</Actions>
			<FileTable listing={this.state.imagesListing}
				onHeaderClick={this.onImagesHeaderClick}
				sort={this.state.sortImages}
				fileLinkPrefix="/mount_image/"
				selected={this.state.imagesSelection}
				onSelected={this.onImagesSelected}
				/>
		</Section>);
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
		this.setState({})
		request.get("/mount").end((err, res) => {
			dispatchRequestError(err);
			let mountStatus: MountStatus = null;
			if (!err) {
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
			dispatchRequestError(err);
			let listing: FileTableEntry[] = [];
			if (!err) {
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
			dispatchRequestError(err);
			this.refresh();
		});
	}

	@boundMethod
	private unmount(): void {
		request.post("/unmount").end((err, res) => {
			dispatchRequestError(err);
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

	private renderDeleteSelected(): JSX.Element {
		return (<ConfirmModal text="Delete these mount images?"
				onAccept={this.deleteSelected}
				onCancel={() => this.setState({deleteSelected: false})}
				acceptText="Delete">
			<Listing listing={this.state.imagesSelection} />
		</ConfirmModal>)
	}

	@boundMethod
	private deleteSelected() {
		request.delete("/mount_image")
			.send({names: this.state.imagesSelection})
			.end((err, res) => {
				dispatchRequestError(err);
				if (res.body)
					dispatchApiErrors('Delete images', res.body);
				this.setState({imagesSelection: [], deleteSelected: false})
				this.refresh();
			});
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
