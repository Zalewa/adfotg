import * as React from 'react';
import { Component, ReactNode } from 'react';
import * as request from 'superagent';
import { boundMethod } from 'autobind-decorator';

import { ActionSet } from '../component/Actions';
import { FileTableEntry } from '../component/FileTable';
import { MountImagesTable } from './StorageTables';
import { MountImage } from '../component/MountImage';
import { dispatchRequestError } from '../component/Notifier';
import { Button } from '../ui/Button';
import { ErrorLabel } from '../ui/Label';
import { AppLink } from '../ui/Link';
import { Section, Subsection } from '../ui/Section';
import { TableLink } from '../ui/Table';
import * as resrc from '../res';
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
	imagesSelection: FileTableEntry[]
	refreshCounter: number
}

const PAGE_SIZE = 50;

export default class Mount extends Component<MountProps, MountState> {
	readonly state: MountState = {
		mountInfo: null,
		imagesSelection: [],
		refreshCounter: 0,
	}

	render() {
		return (<Section title="Mounting">
			<MountArea mountInfo={this.state.mountInfo} onUnmount={this.unmount}
				refreshCounter={this.state.refreshCounter} />
			<MountImagesTable
				search={this.props.search}
				refresh={this.state.refreshCounter}
				pageSize={PAGE_SIZE}
				selected={this.state.imagesSelection}
				onSelected={this.onImagesSelected}
				onRenderFileActions={(entry) => this.renderFileActions(entry)}
				onRenderName={(entry) => this.renderName(entry)}
				/>
		</Section>);
	}

	componentDidMount() {
		this.refresh();
	}

	componentDidUpdate(props: MountProps) {
		if (this.props.refresh !== props.refresh) {
			this.setState({refreshCounter: this.state.refreshCounter + 1});
			this.refresh();
		}
	}

	private renderName(file: FileTableEntry): ReactNode {
		return <AppLink css={TableLink} to={`/inspect/mountimg/${file.name}`}>{file.name}</AppLink>;
	}

	private renderFileActions(file: FileTableEntry): JSX.Element {
		const mountStatus = this.state.mountInfo && this.state.mountInfo.mountStatus
		function canMount() {
			return mountStatus === MountStatus.Unmounted || mountStatus === MountStatus.Mounted;
		}
		function cannotMountReason() {
			if (mountStatus == null)
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

	private refresh(): void {
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
	private onImagesSelected(images: FileTableEntry[]) {
		this.setState({imagesSelection: images});
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
