import * as React from 'react';
import { Component, ReactNode } from 'react';
import * as request from 'superagent';
import { boundMethod } from 'autobind-decorator';

import { Actions, ActionSet } from '../component/Actions';
import { Sort, createSort } from '../app/Storage';
import FileTable, { FileTableEntry, Field,
	RefreshParams}
	from '../component/FileTable';
import List from '../ui/List';
import { MountImage } from '../component/MountImage';
import { dispatchApiErrors, dispatchRequestError } from '../component/Notifier';
import Pager, { Page } from '../component/Pager';
import { Button } from '../ui/Button';
import { LineInput } from '../ui/Input';
import { ErrorLabel } from '../ui/Label';
import { AppLink } from '../ui/Link';
import { ConfirmModal } from '../ui/Modal';
import { Section, Subsection } from '../ui/Section';
import { TableLink } from '../ui/Table';
import * as resrc from '../res';
import { sorted } from '../strings';
import * as skin from '../skin';


const enum MountStatus {
	Mounted = "mounted",
	Unmounted = "unmounted",
	NoImage = "no_image",
	BadImage = "bad_image",
	OtherImageMounted = "other_image_mounted"
}

interface MountInfo {
	error?: string
	mountStatus: MountStatus
	mountedImageName: string
}

interface MountProps {
	refresh: boolean
	search: string
}

interface MountState {
	mountInfo: MountInfo
	imagesListing: FileTableEntry[]
	imagesListingTotal: number
	imagesSelection: FileTableEntry[]
	sortImages: Sort
	deleteSelected: boolean
	refreshCounter: number
	page: Page
}

const PAGE_SIZE = 50;

export default class Mount extends Component<MountProps, MountState> {
	readonly state: MountState = {
		mountInfo: null,
		imagesListing: [],
		imagesListingTotal: 0,
		imagesSelection: [],
		sortImages: createSort(Field.Name),
		deleteSelected: false,
		refreshCounter: 0,
		page: new Page(0, PAGE_SIZE)
	}

	render() {
		return (<Section title="Mounting">
			{this.state.deleteSelected && this.renderDeleteSelected()}
			<MountArea mountInfo={this.state.mountInfo} onUnmount={this.unmount}
				refreshCounter={this.state.refreshCounter} />
			<Actions>
				<ActionSet right={true}>
					<Button purpose="delete"
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
				renderName={(entry) => this.renderName(entry)}
				renderFileActions={(entry) => this.renderFileActions(entry)}
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

	private renderName(file: FileTableEntry): ReactNode {
		return <AppLink css={TableLink} to={`/inspect/mountimg/${file.name}`}>{file.name}</AppLink>;
	}

	private renderFileActions(file: FileTableEntry): JSX.Element {
		const mountStatus = this.state.mountInfo && this.state.mountInfo.mountStatus
		function canMount() {
			return mountStatus === MountStatus.Unmounted;
		}
		function cannotMountReason() {
			if (mountStatus === MountStatus.Mounted)
				return "Currently mounted image must be unmounted first.";
			else if (mountStatus == null)
				return "Cannot mount as current mount status is unknown.";
			else
				return "Current mount status forbids mounting an image.";
		}
		const mountTitle = canMount() ? "Mount this image" : cannotMountReason();

		return (<ActionSet>
			<Button table title={mountTitle} icon={resrc.usb_icon_horz}
					disabled={!canMount()}
					onClick={() => this.mount(file.name)} />
		</ActionSet>);
	}

	private refresh(args?: RefreshParams): void {
		this.setState({});
		request.get("/api/mount").end((err, res) => {
			dispatchRequestError(err);
			let mountStatus: MountStatus = null;
			if (!err) {
				mountStatus = res.body.status;
			}
			this.setState({mountInfo: {
				mountStatus: mountStatus,
				error: err ? err.toString() : res.body.error,
				mountedImageName: res.body.file
			}});
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
			sort: sort.attr,
			dir: sort.dir,
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
			<List listing={this.state.imagesSelection.map(e => e.name)} />
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

interface MountAreaProps {
	refreshCounter: number
	mountInfo: MountInfo
	onUnmount: () => void
}

const MountArea = (props: MountAreaProps) => {
	return (<Subsection title="Mounted Image">
		{props.mountInfo && (<>
			<MountStatusDisplay {...props.mountInfo} />
			{props.mountInfo.mountedImageName &&
				<MountImage showName={false} name={props.mountInfo.mountedImageName}
					refreshCounter={props.refreshCounter} />
			}
			<MountActions mountStatus={props.mountInfo.mountStatus}
				onUnmount={props.onUnmount}
			/>
		</>)}
	</Subsection>);
};

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
		return (<div>
			{this.state.refreshing ?
				this.renderRefreshing() : this.renderWorkspace()}
			{this.renderErrorWidget()}
		</div>);
	}

	private renderWorkspace(): JSX.Element {
		return (<div>
			<span>Create Mount Image with following ADFs:</span>
			<List listing={this.state.sortedAdfs}
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
				<Button purpose="submit" onClick={this.create}
					disabled={this.state.imageName.length == 0}
					title="Create" />
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

interface MountStatusProps {
	error?: string
	mountStatus: MountStatus
	mountedImageName: string
}

type Display = {
	text: string;
	color: string;
}

class MountStatusDisplay extends Component<MountStatusProps> {
	render() {
		const display: Display = this.statusDisplay()
		return <div>
			<span css={{color: display.color}}>{display.text}</span>
			{this.props.mountedImageName &&
				<span>{this.props.mountedImageName}</span>}
			{this.props.error && <ErrorLabel error={this.props.error} />}
		</div>
	}

	private statusDisplay(): Display {
		switch (this.props.mountStatus) {
			case MountStatus.Mounted:
				return {text: "Mounted: ", color: "lime"};
			case MountStatus.Unmounted:
				return {text: "Not mounted", color: "gray"};
			case MountStatus.NoImage:
				return {text: "Image is missing", color: skin.dangerColor};
			case MountStatus.BadImage:
				return {text: "Image error: " + this.props.error,
						color: skin.dangerColor};
			case MountStatus.OtherImageMounted:
				return {text: "An image outside the app is mounted.",
						color: skin.dangerColor}
			default:
				return {text: "Unknown State", color: "gray"};
		}
	}
}

interface MountActionsProps {
	mountStatus: MountStatus,
	onUnmount: ()=>void,
}

class MountActions extends React.Component<MountActionsProps> {
	render() {
		const actions = this.actions();
		return (<div css={{
			marginRight: (actions.length == 0) ? "0em" : "0.25em",
		}}>
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
			<Button key="unmount" title="Unmount"
				onClick={this.props.onUnmount} />,
		];
	}

	private unmountedActions(): JSX.Element[] {
		return [];
	}

	private rescueActions(): JSX.Element[] {
		return [
			<Button key="unmount" title="Force unmount"
				onClick={this.props.onUnmount} />,
		]
	}
}
