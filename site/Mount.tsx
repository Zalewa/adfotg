import * as React from 'react';
import { Component } from 'react';
import * as request from 'superagent';
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
	listing?: string[]
}

export default class Mount extends Component<{}, MountState> {
	readonly state: MountState = {
		mountStatus: null,
		error: null,
		listing: []
	}

	constructor(props: {}) {
		super(props)
		this.mount = this.mount.bind(this);
		this.unmountDiscard = this.unmountDiscard.bind(this);
		this.unmountSave = this.unmountSave.bind(this);
	}

	render() {
		return (<div className="mount">
			<MountStatusDisplay {...this.state} />
			<Listing listing={this.state.listing} />
			<MountActions mountStatus={this.state.mountStatus}
				onMount={this.mount}
				onUnmountAndDiscard={this.unmountDiscard}
				onUnmountAndSave={this.unmountSave}
				/>
		</div>);
	}

	componentDidMount() {
		this.refresh();
	}

	private refresh(): void {
		request.get("/adf/mount").end((err, res) => {
			let mountStatus: MountStatus = null;
			if (res.error) {
				dispatchRequestError(res.error);
			} else {
				mountStatus = res.body.status;
			}
			this.setState({
				mountStatus: mountStatus,
				error: err ? err.toString() : res.body.error,
				listing: res.body.listing
			});
		})
	}

	private mount(): void {
		// TODO we need to pass the selected adfs to this method somehow
		request.post("/adf/mount")
		.send({adfs: []})
		.end((err, res) => {
			if (res.error) {
				dispatchRequestError(res.error);
			}
			this.refresh();
		});
	}

	private unmountDiscard(): void {
		this.unmount("discard");
	}

	private unmountSave(): void {
		this.unmount("save");
	}

	private unmount(how: string): void {
		request.post("/adf/unmount").send({how: how}).end(
			(err, res) => {
				if (res.error) {
					dispatchRequestError(res.error);
				}
				this.refresh();
			});
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
