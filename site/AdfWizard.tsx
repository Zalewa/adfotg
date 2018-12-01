import * as React from 'react';
import { Component } from 'react';
import { boundMethod } from 'autobind-decorator';

import { Actions, ActionSet } from './Actions';
import { FileTableEntry } from './FileTable';
import Uploader from './Uploader';
import * as Strings from './strings';
import { Listing } from './ui';


interface AdfWizardState {
	disks: DiskDescriptor[]
	basename: string
	selection: FileTableEntry[]
}

export default class AdfWizard extends Component {
	readonly state: AdfWizardState = {
		disks: [],
		basename: "adfotg",
		selection: []
	}

	private diskKey: number = 1;

	render() {
		return (<div>
			<Uploader actions={this.actions()}
				onSelected={selection => this.setState({selection})} />
			{this.renderComposition()}
		</div>);
	}

	private actions(): JSX.Element[] {
		let actions: JSX.Element[] = [];
		actions.push(<button key="distribute"
			disabled={this.state.selection.length == 0}
			onClick={this.distributeDisks}>Distribute ADFs</button>);
		actions.push(<span key="basename">
			<label>Base name:</label>
			<input value={this.state.basename}
				onChange={e => this.setState({basename: e.target.value})} />
		</span>);
		return actions;
	}

	private renderComposition(): JSX.Element {
		if (this.state.disks.length == 0)
			return null;
		return <DiskComposition parent={this} disks={this.state.disks} />
	}

	private addDisk(name: string, label: string, contents: FileOp[]): void {
		let { disks } = this.state;
		let descriptor = new DiskDescriptor();
		descriptor.name = name;
		descriptor.label = label;
		descriptor.contents = contents.slice();
		descriptor.key = this.diskKey++;
		disks.push(descriptor);
		this.setState({disks});
	}

	@boundMethod
	public clearDisks() {
		this.diskKey = 1;
		this.setState({disks: []});
	}

	@boundMethod
	public discardDisk(disk: DiskDescriptor): void {
		const { disks } = this.state;
		const idx = disks.findIndex(e => e.key == disk.key);
		if (idx != -1) {
			disks.splice(idx, 1);
		}
		this.setState({disks});
	}

	@boundMethod
	private distributeDisks(): void {
		const files = this.state.selection;
		const { basename } = this.state;
		let distributor = new Distributor(files);
		const disks: FileOp[][] = distributor.distribute();
		for (let diskNum = 0; diskNum < disks.length; ++diskNum) {
			const name = basename + (diskNum + 1);
			const label = basename + " " + (diskNum + 1);
			this.addDisk(name, label, disks[diskNum]);
		}
	}

	@boundMethod
	public submit(): void {
		console.log("submit");
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


interface DiskCompositionProps {
	parent: AdfWizard
	disks: DiskDescriptor[]
}

class DiskComposition extends Component<DiskCompositionProps> {
	render() {
		const { parent } = this.props;
		return (<div className="diskComposition">
			<button className="buttonSubmit" onClick={parent.submit}>
				Submit</button>
			<button className="buttonBig" onClick={parent.clearDisks}>
				Discard All</button>
			{this.renderDisks()}
		</div>);
	}

	private renderDisks(): JSX.Element[] {
		const { parent, disks } = this.props;
		return disks.map((disk: DiskDescriptor) =>
			<DiskForm key={disk.key} disk={disk}
				onDiscard={() => parent.discardDisk(disk)}
				onNameEdited={s => {
					disk.setName(s);
					parent.setState({disks});
				}}
				onLabelEdited={s => {
					disk.setLabel(s);
					parent.setState({disks});
				}}
			/>);
	}
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
				<div>
					<label>Contents:</label>
					<Listing listing={this.items()}></Listing>
				</div>
			</form>
		</div>)
	}

	private items(): string[] {
		return this.props.disk.contents.map(getFileOpDisplayName);//(file: FileOp) => file.getDisplayName());
	}
}

class Distributor {
	private static readonly ADF_SIZE = 880 * 1024
	private static readonly BUFFER_SPACE = 10 * 1024;
	private static readonly MAX_SIZE = Distributor.ADF_SIZE - Distributor.BUFFER_SPACE;
	private files: FileTableEntry[];

	constructor(files: FileTableEntry[]) {
		this.files = files.slice();
	}

	/**
	 * Return value is a two-dimensional array of FileOp. The first
	 * dimension are disks, the second dimension are files that fit
	 * on each of the disks.
	 */
	public distribute(): FileOp[][] {
		let distribution: FileOp[][] = [];

		// 1. Sort files by size descending
		let sorted = this.files.sort((a, b) => b.size - a.size);

		// 2. Split files that won't fit on a disk
		const toobig = sorted.filter(e => e.size > Distributor.MAX_SIZE);
		let splits: FileOp[] = [];
		toobig.forEach(bigfile => {
			const partsize = Distributor.MAX_SIZE;
			const parts_count = Math.ceil(bigfile.size / partsize);
			for (let i = 0; i < parts_count; ++i) {
				const start = i * partsize;
				const end = start + partsize;
				const length = (end > bigfile.size) ?
					(bigfile.size - start) : Distributor.MAX_SIZE;
				splits.push({
					name: bigfile.name, start, length,
					rename: bigfile.name + "." + Strings.leftpad("" + i, "0", 3)
				});
			}
		});

		// 3. Place the split files to fill the disks
		splits.forEach(op => distribution.push([op]));

		// 4. Files that fit onto disks should be distributed
		//    to try to fill up the whole disk
		let fitting = sorted.filter(e => e.size <= Distributor.MAX_SIZE);
		while (fitting.length > 0) {
			let disk: FileTableEntry[] = [];
			const takenspace = () => disk.reduce((prev, cur) => prev + cur.size, 0);
			const freespace = () => Distributor.MAX_SIZE - takenspace();
			// 4.1. Start with largest file and put it on to the disk
			disk.push(fitting.shift());
			while (fitting.length > 0) {
				// 4.2. Find next largest file that still fits
				//      and put it on the disk
				const idx = fitting.findIndex(e => e.size <= freespace());
				if (idx >= 0) {
					const file = fitting[idx];
					fitting.splice(idx, 1);
					disk.push(file);
				} else {
					break;
				}
			}
			distribution.push(disk.map(f => {return {name: f.name}}));
		}

		return distribution;
	}
}
