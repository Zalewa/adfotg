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
	NoImage = "no_image",
	BadImage = "bad_image",
	OtherImageMounted = "other_image_mounted"
}

interface MountProps {
	refresh: boolean
}

interface MountState {
	mountStatus: MountStatus,
	error?: string,
	mountedImageName: string,
	imagesListing: FileTableEntry[],
	imagesSelection: string[],
	inspectedImage: string,
	sortImages: Sort,
	deleteSelected: boolean
}

export default class Mount extends Component<MountProps, MountState> {
	readonly state: MountState = {
		mountStatus: null,
		error: null,
		mountedImageName: "",
		imagesListing: [],
		imagesSelection: [],
		inspectedImage: null,
		sortImages: createSort(Field.Name),
		deleteSelected: false
	}

	render() {
		return (<Section title="Mounting" className="mount">
			{this.state.deleteSelected && this.renderDeleteSelected()}
			{this.renderMountStatus()}
			{this.renderImageInspection()}
			<Actions>
				<ActionSet>
					<MountActions mountStatus={this.state.mountStatus}
						images={this.state.imagesSelection}
						onMount={this.mount}
						onUnmount={this.unmount}
					/>
					<button onClick={() => this.setState({inspectedImage: this.state.imagesSelection[0]}) }
						disabled={this.state.imagesSelection.length == 0}>Inspect</button>
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

	private renderMountStatus(): JSX.Element {
		return (<Section title="Mounted Image" className="mountedImage">
			<MountStatusDisplay {...this.state} />
			{this.state.mountedImageName && <MountImageDetails name={this.state.mountedImageName} />}
		</Section>);
	}

	private renderImageInspection(): JSX.Element {
		if (this.state.inspectedImage) {
			return (<Section title="Inspect Image" className="inspectedImage">
				<Actions>
					<ActionSet>
						<button onClick={() => this.setState({inspectedImage: null})}>Close</button>
					</ActionSet>
				</Actions>
				<MountImageDetails name={this.state.inspectedImage} />
			</Section>);
		} else {
			return null;
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
				mountedImageName: res.body.file
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
			<button onClick={this.create}
				disabled={this.state.imageName.length == 0}>Create</button>
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
				return {text: "Image error: " + this.props.error,
						klass: "badstatus"};
			case MountStatus.OtherImageMounted:
				return {text: "An image outside the app is mounted.",
						klass: "badstatus"}
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
			case MountStatus.BadImage:
			case MountStatus.OtherImageMounted:
			default:
				return this.rescueActions();
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

	private rescueActions(): JSX.Element[] {
		return [
			<button key="unmount" onClick={this.props.onUnmount}>Force Unmount</button>
		]
	}
}

interface MountImageDetailsProps {
	name: string
}

interface MountImageDetailsState {
	listing: FileTableEntry[]
}

class MountImageDetails extends Component<MountImageDetailsProps, MountImageDetailsState> {
	readonly state: MountImageDetailsState = {
		listing: []
	}

	render() {
		return (<div className="imageDetails">
			<span className="imageDetails__name">{this.props.name}</span>
			<FileTable listing={this.state.listing}
				fileLinkPrefix={this.contentsApi() + "/"} />
		</div>);
	}

	componentDidMount() {
		this.refresh()
	}

	componentWillReceiveProps(props: MountImageDetailsProps) {
		if (this.props.name !== props.name) {
			this.refresh();
		}
	}

	private contentsApi(): string {
		return "/mount_image/" + this.props.name + "/contents";
	}

	private refresh(): void {
		request.get(this.contentsApi()).end((err, res) => {
			dispatchRequestError(err);
			if (!err) {
				this.setState({listing: res.body});
			} else {
				this.setState({listing: []});
			}
		})
	}
}
