import * as React from 'react';
import { Component } from 'react';
import { boundMethod } from 'autobind-decorator';
import * as request from 'superagent';

import { Actions, ActionSet } from './Actions';
import { FileTableEntry } from './FileTable';
import Form, { FormItem } from './Form';
import Listing from './Listing';
import { Notification, NoteType, errorToString } from './Notifier';
import Uploader from './Uploader';
import { LineInput } from './ui';
import * as Strings from './strings';
import style from './style.less';


interface AdfWizardState {
	disks: DiskDescriptor[]
	basename: string
	selection: FileTableEntry[]
	submitting: boolean
	submitted: boolean
}

export default class AdfWizard extends Component {
	readonly state: AdfWizardState = {
		disks: [],
		basename: "adfotg",
		selection: [],
		submitting: false,
		submitted: false
	}

	private disks: DiskDescriptor[] = [];
	private diskKey: number = 1;

	render() {
		return (<div>
			<Uploader actions={this.actions()}
				onSelected={selection => this.setState({selection})} />
			<button className={style.button} onClick={this.addEmptyDisk}>Add Empty ADF</button>
			{this.state.submitted && this.renderSubmitted()}
			{this.state.disks.length > 0 && this.renderComposition()}
		</div>);
	}

	private actions(): JSX.Element[] {
		return [
			<button key="distribute" className={style.button}
				disabled={this.state.selection.length == 0 || this.state.submitting}
				onClick={this.distributeDisks}>Distribute ADFs</button>,
			<label key="basenamelabel"
				className={style.actionsElementCenter}>Base name:</label>,
			<LineInput key="basenamevalue" value={this.state.basename}
				type="text"
				onChange={e => this.setState({basename: e.target.value})} />
		]
	}

	private renderComposition(): JSX.Element {
		return <DiskComposition parent={this} disks={this.state.disks}
			allowSubmit={!this.state.submitting} />
	}

	private renderSubmitted(): JSX.Element {
		if (this.state.disks.length == 0) {
			return <Notification note={{
				type: NoteType.Success,
				message: "Disks created!"}} />
		} else {
			return <Notification note={{
				type: NoteType.Error,
				message: "Some disks were not created." }} />
		}
	}

	@boundMethod
	private addEmptyDisk(): void {
		this.addDisk(
			this.state.basename + "" + this.diskKey,
			this.state.basename + " " + this.diskKey,
			[]);
	}

	private addDisk(name: string, label: string, contents: FileOp[]): void {
		let descriptor = new DiskDescriptor();
		descriptor.name = name;
		descriptor.label = label;
		descriptor.contents = contents.slice();
		descriptor.key = this.diskKey++;
		this.disks.push(descriptor);
		this.setState({disks: this.disks, submitted: false});
	}

	@boundMethod
	public clearDisks() {
		this.disks = []
		this.diskKey = 1;
		this.setState({disks: this.disks, submitted: false, submitting: false});
	}

	@boundMethod
	public discardDisk(disk: DiskDescriptor): void {
		const idx = this.disks.findIndex(e => e.key == disk.key);
		if (idx != -1) {
			this.disks.splice(idx, 1);
		}
		this.setState({disks: this.disks, submitted: false});
	}

	@boundMethod
	private distributeDisks(): void {
		this.clearDisks();
		const files = this.state.selection;
		const { basename } = this.state;
		let distributor = new Distributor(files);
		const disks: FileOp[][] = distributor.distribute();
		for (let diskNum = 0; diskNum < disks.length; ++diskNum) {
			const name = basename + (diskNum + 1);
			const label = basename + " " + (diskNum + 1);
			this.addDisk(name, label, disks[diskNum]);
		}
		this.setState({submitted: false});
	}

	@boundMethod
	public submit(): void {
		this.setState({submitting: true, submitted: false});
		this.submitAsync().then(() => {
			if (this.state.submitting) {
				if (this.disks.every(d => d.done)) {
					this.disks = [];
				}
				this.setState({submitting: false, submitted: true, disks: this.disks});
			}
		});
	}

	private async submitAsync(): Promise<void> {
		const disks = this.disks.slice();
		let requests = disks.map(disk => {
			return request.post("/adf/" + disk.name + ".adf")
				.send({label: disk.label, contents: disk.contents});
		});
		for (let i = 0; i < requests.length; ++i) {
			try {
				let res  = await requests[i];
				disks[i].done = true;
			} catch (e) {
				disks[i].error = errorToString(e);
			}
			this.setState({disks: this.disks});
		}
	}
}

class DiskDescriptor {
	public name: string
	public label: string
	public contents: FileOp[]

	public error: string
	public done: boolean = false;
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
	allowSubmit: boolean
}

class DiskComposition extends Component<DiskCompositionProps> {
	render() {
		const { parent } = this.props;
		return (<div className={style.diskComposition}>
			<button className={`${style.button} ${style.buttonSubmit}`} onClick={parent.submit}
				disabled={!this.props.allowSubmit}>
				Submit</button>
			<button className={`${style.button} ${style.buttonBig}`} onClick={parent.clearDisks}>
				Discard All</button>
			{this.renderDisks()}
		</div>);
	}

	private renderDisks(): JSX.Element[] {
		const { disks } = this.props;
		return disks.map((disk: DiskDescriptor) =>
			!disk.done ?
				this.renderForm(disk) :
				this.renderDone(disk)
		);
	}

	private renderForm(disk: DiskDescriptor) {
		const { parent, disks } = this.props;
		return <DiskForm key={disk.key} name={disk.name}
			label={disk.label} contents={disk.contents}
			error={disk.error}
			onDiscard={() => parent.discardDisk(disk)}
			onNameEdited={s => {
				disk.setName(s);
				parent.setState({disks});
			}}
			onLabelEdited={s => {
				disk.setLabel(s);
				parent.setState({disks});
			}}
		/>
	}

	private renderDone(disk: DiskDescriptor) {
		return <Notification key={disk.key} note={{
			type: NoteType.Success,
			message: "Disk '" + disk.name + "' done!"}} />
	}
}


interface DiskFormProps {
	name: string
	label: string
	contents: FileOp[]
	error: string
	onDiscard: ()=>void
	onNameEdited: (value: string)=>void
	onLabelEdited: (value: string)=>void
}

interface DiskFormState {
	nameError: string
}

class DiskForm extends Component<DiskFormProps, DiskFormState> {
	readonly state: DiskFormState = {
		nameError: ""
	}

	render() {
		const props = this.props;
		const { name, label, contents, error } = this.props;
		return (<div className={style.diskForm}>
			<button className={`${style.button} ${style.buttonFormClose}`} onClick={props.onDiscard}>X</button>
			{error && error.length > 0 && (
				<Notification note={{type: NoteType.Error, message: error}} />)}
			<Form>
				<FormItem label="Name" hint=".adf"
					note={this.state.nameError && {
						type: NoteType.Error,
						message: this.state.nameError}}>
					<input value={name} type="text" className={`${style.textInput} ${style.formWidgetFull}`}
						onChange={e => props.onNameEdited(e.target.value)} />
				</FormItem>
				<FormItem label="Label">
					<input value={label} type="text" className={`${style.textInput} ${style.formWidgetFull}`}
						onChange={e => props.onLabelEdited(e.target.value)} />
				</FormItem>
				<FormItem label="Contents">
					<Listing className={style.diskFormListing} listing={this.items()}></Listing>
				</FormItem>
			</Form>
		</div>)
	}

	componentDidMount() {
		this.validateDiskName(this.props.name);
	}

	componentDidUpdate(props: DiskFormProps) {
		if (props.name !== this.props.name) {
			this.validateDiskName(this.props.name);
		}
	}

	private validateDiskName(name: string): void {
		request.head("/adf/" + name + ".adf").end((err, res) => {
			if (res.status == 404) {
				// This is good! Stop processing.
				this.setState({nameError: ""});
			} else if (res.status == 200) {
				this.setState({nameError: "File already exists"});
			} else {
				const message: string = err ? errorToString(err) : "unknown error";
				this.setState({nameError: message})
			}
		})
	}

	private items(): string[] {
		return this.props.contents.map(getFileOpDisplayName);
	}
}

class Distributor {
	private static readonly ADF_SIZE = 880 * 1024
	private static readonly BUFFER_SPACE = 15 * 1024;
	private static readonly META_SPACE_PER_FILE = 2 * 1024;
	private static readonly MAX_SIZE = Distributor.ADF_SIZE - Distributor.BUFFER_SPACE;
	private static readonly MAX_FILENAME = 30;
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
					rename: this.trimFilename(bigfile.name, "." + Strings.leftpad("" + (i + 1), "0", 3))
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
			const takenspace = () => {
				return Distributor.META_SPACE_PER_FILE * (disk.length + 1)
					+ disk.reduce((prev, cur) => prev + cur.size, 0);
			};
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
			distribution.push(disk.map(f => {return {
				name: f.name,
				rename: this.trimFilename(f.name)}
			}));
		}

		return distribution;
	}

	private trimFilename(name: string, trail?: string): string {
		trail = trail || "";
		const maxLen = Distributor.MAX_FILENAME;
		if ((name + trail).length < maxLen) {
			return name + trail;
		} else {
			const fitNameLen = maxLen - trail.length;
			return name.substr(0, fitNameLen) + trail;
		}
	}
}
