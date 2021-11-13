import * as React from 'react';
import { Component } from 'react';
import * as request from 'superagent';
import { boundMethod } from 'autobind-decorator';

import { Actions, ActionSet } from '../component/Actions';
import FileTable, { FileTableEntry, Field, Sort, createSort,
	RefreshParams}
	from '../component/FileTable';
import Listing from '../component/Listing';
import { ConfirmModal } from '../component/Modal';
import { dispatchApiErrors, dispatchRequestError } from '../component/Notifier';
import Pager, { Page } from '../component/Pager';
import { Section, Subsection } from '../component/Section';
import * as resrc from '../res';
import style from '../style.less';
import { sorted } from '../strings';
import { DeleteButton, ErrorLabel, Icon, Labelled, LineInput } from '../component/ui';


const enum MountStatus {
	Mounted = "mounted",
	Unmounted = "unmounted",
	NoImage = "no_image",
	BadImage = "bad_image",
	OtherImageMounted = "other_image_mounted"
}

interface MountProps {
	refresh: boolean
	search: string
}

interface MountState {
	mountStatus: MountStatus
	error?: string
	mountedImageName: string
	imagesListing: FileTableEntry[]
	imagesListingTotal: number
	imagesSelection: FileTableEntry[]
	inspectedImage: string
	sortImages: Sort
	deleteSelected: boolean
	refreshCounter: number
	page: Page
}

const PAGE_SIZE = 50;

export default class Mount extends Component<MountProps, MountState> {
	readonly state: MountState = {
		mountStatus: null,
		error: null,
		mountedImageName: "",
		imagesListing: [],
		imagesListingTotal: 0,
		imagesSelection: [],
		inspectedImage: null,
		sortImages: createSort(Field.Name),
		deleteSelected: false,
		refreshCounter: 0,
		page: new Page(0, PAGE_SIZE)
	}

	render() {
		return (<Section title="Mounting">
			{this.state.deleteSelected && this.renderDeleteSelected()}
			{this.renderMountStatus()}
			{this.renderImageInspection()}
			<Actions>
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
				fileLinkPrefix="/api/mountimg"
				selected={this.state.imagesSelection}
				onSelected={this.onImagesSelected}
				renderFileActions={(name) => this.renderFileActions(name)}
				/>
			<Pager page={this.state.page} total={this.state.imagesListingTotal}
				onPageChanged={page => this.refreshImages({page})} />
		</Section>);
	}

	componentDidMount() {
		this.refresh();
		this.refreshImages();
	}

	componentDidUpdate(props: MountProps) {
		if (this.props.refresh !== props.refresh || this.props.search !== props.search) {
			this.setState({refreshCounter: this.state.refreshCounter + 1});
			this.refresh({search: this.props.search});
		}
	}

	private renderFileActions(file: FileTableEntry): JSX.Element {
		const self = this;
		function canMount() {
			return self.state.mountStatus === MountStatus.Unmounted;
		}
		function cannotMountReason() {
			if (self.state.mountStatus === MountStatus.Mounted)
				return "Currently mounted image must be unmounted first.";
			else if (self.state.mountStatus == null)
				return "Cannot mount as current mount status is unknown.";
			else
				return "Current mount status forbids mounting an image.";
		}
		const mountTitle = canMount() ? "Mount this image" : cannotMountReason();

		return (<ActionSet>
			<button className={`${style.button} ${style.buttonTable} ${style.buttonIconTable}`}
					onClick={() => this.setState({inspectedImage: file.name})}>
				<Icon table button title="Inspect" src={resrc.looking_glass} />
			</button>
			<button className={`${style.button} ${style.buttonTable} ${style.buttonIconTable}`}
					disabled={!canMount()}
					onClick={() => this.mount(file.name)}>
				<Icon table button title={mountTitle} src={resrc.usb_icon_horz} />
			</button>
		</ActionSet>);
	}

	private renderMountStatus(): JSX.Element {
		return (<Subsection title="Mounted Image">
			<MountStatusDisplay {...this.state} />
			{this.state.mountedImageName && (
				<MountImageDetails showName={false} name={this.state.mountedImageName}
					refreshCounter={this.state.refreshCounter} />)
			}
			<MountActions mountStatus={this.state.mountStatus}
				images={this.state.imagesSelection.map(e => e.name)}
				onMount={this.mount}
				onUnmount={this.unmount}
				/>
		</Subsection>);
	}

	private renderImageInspection(): JSX.Element {
		if (this.state.inspectedImage) {
			return (<Subsection title="Inspect Image">
				<button className={`${style.button} ${style.buttonSectionClose}`}
					onClick={() => this.setState({inspectedImage: null})}>Close</button>
				<MountImageDetails name={this.state.inspectedImage}
					refreshCounter={this.state.refreshCounter} />
			</Subsection>);
		} else {
			return null;
		}
	}

	private refresh(args?: RefreshParams): void {
		this.setState({})
		request.get("/api/mount").end((err, res) => {
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
		this.refreshImages(args);
	}

	private refreshImages(args?: RefreshParams): void {
		args = args || {};
		const sort = args.sort || this.state.sortImages;
		const page = args.page || this.state.page;
		const search = (args.search !== undefined && args.search !== null)
					 ? args.search : this.props.search;
		request.get("/api/mountimg").query({
			filter: search,
			sort: sort.field,
			dir: sort.ascending ? "asc" : "desc",
			start: page.start,
			limit: page.limit
		}).end((err, res) => {
			dispatchRequestError(err);
			let listing: FileTableEntry[] = [];
			let listingTotal: number = 0;
			if (!err) {
				listing = res.body.listing;
				listingTotal = res.body.total;
			}
			this.setState({
				imagesListing: listing,
				imagesListingTotal: listingTotal,
				sortImages: sort,
				page
			})
			if (page.start != 0 && page.start > listingTotal)
				this.refreshImages({page: new Page(0, page.limit)});
		})
	}

	@boundMethod
	private mount(image: string): void {
		request.post("/api/mount/" + image).end((err, res) => {
			dispatchRequestError(err);
			this.refresh();
		});
	}

	@boundMethod
	private unmount(): void {
		request.delete("/api/mount").end((err, res) => {
			dispatchRequestError(err);
			this.refresh();
		});
	}

	@boundMethod
	private onImagesHeaderClick(field: Field) {
		this.refreshImages({sort: createSort(field, this.state.sortImages)});
	}

	@boundMethod
	private onImagesSelected(images: FileTableEntry[]) {
		this.setState({imagesSelection: images});
	}

	private renderDeleteSelected(): JSX.Element {
		return (<ConfirmModal text="Delete these mount images?"
				onAccept={this.deleteSelected}
				onCancel={() => this.setState({deleteSelected: false})}
				acceptText="Delete"
				acceptPurpose="delete">
			<Listing listing={this.state.imagesSelection.map(e => e.name)} />
		</ConfirmModal>)
	}

	@boundMethod
	private deleteSelected() {
		request.delete("/api/mountimg")
			.send({names: this.state.imagesSelection.map(e => e.name)})
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
	adfs: string[]
	onDone?: ()=>void
}

interface CreateMountImageState {
	error: Error
	imageName: string
	sortedAdfs: string[]
	refreshing: boolean
}

export class CreateMountImage extends React.Component<CreateMountImageProps, CreateMountImageState> {
	constructor(props: CreateMountImageProps) {
		super(props);
		this.state = {
			sortedAdfs: sorted(props.adfs),
			error: null,
			imageName: "",
			refreshing: true
		}
	}

	render() {
		return (<div className={style.createMountImage}>
			{this.state.refreshing ?
				this.renderRefreshing() : this.renderWorkspace()}
			{this.renderErrorWidget()}
		</div>);
	}

	private renderWorkspace(): JSX.Element {
		return (<div>
			<span>Create Mount Image with following ADFs:</span>
			<Listing listing={this.state.sortedAdfs}
				onOrderChange={(sortedAdfs) => this.setState({sortedAdfs})} />
			<Actions submit fullrow>
			<ActionSet>
				<LineInput autoFocus type="text"
					value={this.state.imageName}
					onChange={e => this.onNameChange(e.target.value)}
					onKeyPress={e => {
						if (e.key === "Enter") {
							this.create();
						}
					}} />
			</ActionSet>
			<ActionSet right>
				<button className={`${style.button} ${style.buttonSubmit}`} onClick={this.create}
					disabled={this.state.imageName.length == 0}>Create</button>
			</ActionSet>
			</Actions>
		</div>);
	}

	private renderRefreshing(): JSX.Element {
		if (!this.state.error) {
			return (<div>
				<div>Obtaining some extra data ...</div>
				<div><img width="100%" src={resrc.loader} /></div>
			</div>);
		} else {
			return (<div>An error has occurred during refresh.</div>);
		}
	}

	private renderErrorWidget(): JSX.Element {
		if (this.state.error) {
			return <ErrorLabel error={this.state.error} />;
		}
		return null;
	}

	componentDidMount() {
		request.get("/api/adf/std").end((err, res) => {
			if (err) {
				this.setState({error: err})
			} else {
				let stdAdfs = res.body;
				let sortedAdfs = this.state.sortedAdfs;
				this.setState({
					sortedAdfs: stdAdfs.concat(sortedAdfs),
					refreshing: false
				});
			}
		});
	}

	@boundMethod
	private create(): void {
		if (!this.state.imageName)
			return;
		request.put("/api/mountimg/" + this.state.imageName + "/pack_adfs")
			.send({adfs: this.state.sortedAdfs})
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
	className: string;
}

class MountStatusDisplay extends Component<MountStatusProps> {
	render() {
		const display: Display = this.statusDisplay()
		return <div className={style.mountStatus}>
			<span className={`${style.mountStatusLabel} ${display.className}`}>{display.text}</span>
			{this.props.mountedImageName &&
				<span className={style.mountImageName}>{this.props.mountedImageName}</span>}
		</div>
	}

	private statusDisplay(): Display {
		switch (this.props.mountStatus) {
			case MountStatus.Mounted:
				return {text: "Mounted: ", className: style.mountStatusLabelMounted};
			case MountStatus.Unmounted:
				return {text: "Not mounted", className: style.mountStatusLabelUnmounted};
			case MountStatus.NoImage:
				return {text: "Image is missing", className: style.mountStatusLabelBadstatus};
			case MountStatus.BadImage:
				return {text: "Image error: " + this.props.error,
						className: style.mountStatusLabelBadstatus};
			case MountStatus.OtherImageMounted:
				return {text: "An image outside the app is mounted.",
						className: style.mountStatusLabelBadstatus}
			default:
				return {text: "Unknown State", className: style.mountStatusLabelUnknown};
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
		const actions = this.actions();
		const mod = actions.length == 0 ? " mount__actions--empty" : "";
		return (<div className={`${style.mountActions} ${mod}`}>
			{actions}
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
				return this.rescueActions();
			default:
				return [];
		}
	}

	private mountedActions(): JSX.Element[] {
		return [
			<button className={style.button} key="unmount"
				onClick={this.props.onUnmount}>Unmount</button>,
		];
	}

	private unmountedActions(): JSX.Element[] {
		return [];
	}

	private rescueActions(): JSX.Element[] {
		return [
			<button className={style.button} key="unmount"
				onClick={this.props.onUnmount}>Force Unmount</button>
		]
	}
}

interface MountImageDetailsProps {
	name: string
	showName?: boolean
	refreshCounter: number
}

interface MountImageDetailsState {
	listing: FileTableEntry[]
}


class MountImageDetails extends Component<MountImageDetailsProps, MountImageDetailsState> {
	readonly state: MountImageDetailsState = {
		listing: []
	}

	render() {
		let { showName } = this.props;
		if (showName === undefined)
			showName = true;
		return (<div className={style.imageDetails}>
			{showName &&
				<Labelled label="Image:" contents={this.props.name} />}
			<FileTable listing={this.state.listing}
				fileLinkPrefix={this.contentsApi()} />
		</div>);
	}

	componentDidMount() {
		this.refresh()
	}

	componentDidUpdate(props: MountImageDetailsProps) {
		if (this.props.name !== props.name ||
				this.props.refreshCounter !== props.refreshCounter) {
			this.refresh(this.props.name);
		}
	}

	private refresh(name?: string): void {
		name = name || this.props.name;
		this.setState({listing: []});
		request.get(this.contentsApi(name)).end((err, res) => {
			dispatchRequestError(err);
			if (!err) {
				this.setState({listing: res.body});
			} else {
				this.setState({listing: []});
			}
		})
	}

	private contentsApi(name?: string): string {
		name = name || this.props.name;
		return "/api/mountimg/" + name + "/contents";
	}
}
