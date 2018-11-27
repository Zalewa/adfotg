import * as React from 'react';
import { Component } from 'react';
import { boundMethod } from 'autobind-decorator';

import { Actions, ActionSet } from './Actions';
import Uploader from './Uploader';
import { Listing } from './ui';


interface AdfWizardState {
	disks: DiskDescriptor[]
	key: number
	basename: string
}

export default class AdfWizard extends Component {
	readonly state: AdfWizardState = {
		disks: [],
		key: 1,
		basename: "adfotg"
	}

	render() {
		return (<div>
			<Uploader />
			<Actions>
				<ActionSet>
					<button onClick={this.addAdf}>
						Add ADF
					</button>
					<label>Base name:</label>
					<input value={this.state.basename} onChange={
						e => this.setState({basename: e.target.value})
					} />
				</ActionSet>
			</Actions>
			{this.renderDisks()}
		</div>);
	}

	private renderDisks(): JSX.Element[] {
		const { disks } = this.state;
		return disks.map((disk: DiskDescriptor) =>
			<DiskForm key={disk.key} disk={disk}
				onDiscard={() => this.discardDisk(disk)}
				onNameEdited={s => {
					disk.setName(s);
					this.setState({disks});
				}}
				onLabelEdited={s => {
					disk.setLabel(s);
					this.setState({disks});
				}}
			/>);
	}

	@boundMethod
	private addAdf(): void {
		const { disks, key, basename } = this.state;
		const descriptor = new DiskDescriptor();
		descriptor.name = basename + key
		descriptor.label = basename + key;
		descriptor.contents = [];
		descriptor.key = key;
		disks.push(descriptor);
		this.setState({disks, key: key + 1});
	}

	@boundMethod
	private discardDisk(disk: DiskDescriptor): void {
		const { disks } = this.state;
		const idx = disks.findIndex(e => e.key == disk.key);
		if (idx != -1) {
			disks.splice(idx, 1);
		}
		this.setState({disks});
	}
}

class DiskDescriptor {
	public name: string
	public label: string
	public contents: FileOp[]
	public key: number

	public setName(v: string): void {
		this.name = v;
	}

	public setLabel(v: string): void {
		this.label = v;
	}
}

interface FileOp {
	name: string
	start?: number
	length?: number
	rename?: string
}

function getFileOpDisplayName(op: FileOp) {
	return op.rename || op.name;
}


interface DiskFormProps {
	disk: DiskDescriptor
	onDiscard: ()=>void
	onNameEdited: (value: string)=>void
	onLabelEdited: (value: string)=>void
}

class DiskForm extends Component<DiskFormProps> {
	render() {
		const props = this.props;
		const { disk } = this.props;
		return (<div className="diskForm">
			<button className="diskForm__close" onClick={props.onDiscard}>X</button>
			<form>
				<p>
					<label>Name:</label>
					<input value={disk.name}
					onChange={e => props.onNameEdited(e.target.value)} />
					<label>.adf</label>
				</p>
				<p>
					<label>Label:</label>
					<input value={disk.label}
						onChange={e => props.onLabelEdited(e.target.value)} />
				</p>
				<p>
					<label>Contents:</label>
					<Listing listing={this.items()}></Listing>
				</p>
			</form>
		</div>)
	}

	private items(): string[] {
		return this.props.disk.contents.map(getFileOpDisplayName);//(file: FileOp) => file.getDisplayName());
	}
}
