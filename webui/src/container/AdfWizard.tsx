import { useEffect, useState, type ReactNode } from 'react'
import * as request from 'superagent'

import { type FileTableEntry } from '@/component/FileTable'
import List from '@/ui/List'
import { Notification, NoteType } from '@/component/Notifier'
import Upload from '@/container/Upload'
import { Button } from '@/ui/Button'
import { Form, FormItem } from '@/ui/Form'
import { LineInput } from '@/ui/Input'
import { errorToString } from '@/text'
import * as Strings from '@/strings'
import * as skin from '@/skin'

interface AdfWizardProps {
	search: string
}

function nextDiskKey(disks: DiskDescriptor[]): number {
	return disks.length > 0
		? disks[disks.length - 1].key + 1
		: 1
}

const AdfWizard = ({search}: AdfWizardProps) => {
	const [disks, setDisks] = useState<DiskDescriptor[]>([])
	const [basename, setBasename] = useState("adfotg")
	const [selection, setSelection] = useState<FileTableEntry[]>([])
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isSubmitted, setIsSubmitted] = useState(false)

	function createDisk(key: number, name: string, label: string, contents: FileOp[]): DiskDescriptor {
		const descriptor = new DiskDescriptor()
		descriptor.name = name
		descriptor.label = label
		descriptor.contents = contents
		descriptor.key = key
		return descriptor
	}

	function addDisk(name: string, label: string, contents: FileOp[]): void {
		const newDisk = createDisk(-1, name, label, contents)
		setDisks(disks => {
			newDisk.key = nextDiskKey(disks)
			return [...disks, newDisk]
		})
		setIsSubmitted(false)
	}

	function addEmptyDisk(): void {
		const diskKey = nextDiskKey(disks)
		addDisk(
			basename + "" + diskKey,
			basename + " " + diskKey,
			[],
		)
	}

	function distributeDisks(): void {
		const files = selection
		const distributor = new Distributor(files)
		const diskDistribution: FileOp[][] = distributor.distribute()
		const disks = diskDistribution.map((contents, index) => {
			const name = basename + (index + 1)
			const label = basename + " " + (index + 1)
			return createDisk(index, name, label, contents)
		})
		setDisks(disks)
		setIsSubmitted(false)
	}

	function submit(): void {
		setIsSubmitting(true)
		setIsSubmitted(false)
		submitAsync()
			.then(() => {
				setIsSubmitting(false)
				setIsSubmitted(true)
				if (disks.every(d => d.done)) {
					// If everything was successful, clear the disks.
					setDisks([])
				} else {
					// In case of failure, keep the disks so the user can see which failed.
					setDisks([...disks])
				}
			})
	}

	async function submitAsync(): Promise<void> {
		interface DiskRequest {
			request: any
			disk: DiskDescriptor
		}
		const requests: DiskRequest[] = disks.map(
			disk => ({
				disk,
				request: request
					.post("/api/adf/image/" + disk.name + ".adf")
					.send({label: disk.label, contents: disk.contents}),
			})
		)
		const resultingDisks = await Promise.all(
			requests.map(async ({disk, request}) => {
				try {
					await request
					disk.done = true
				} catch (e) {
					disk.error = errorToString(e)
				}
				return disk
			})
		)
		setDisks(resultingDisks)
	}

	function actions(): ReactNode {
		return (
			<>
				<Button
					disabled={selection.length == 0 || isSubmitting}
					onClick={distributeDisks}
					title="Distribute ADFs"
				/>
				<label css={{alignSelf: "center"}}>Base name:</label>
				<LineInput
					type="text"
					value={basename}
					onChange={e => setBasename(e.target.value)}
				/>
			</>
		)
	}

	const submitIsOkay = isSubmitted && disks.length == 0

	return (
		<div>
			<Upload
				actions={actions()}
				search={search}
				selected={selection}
				onSelected={selection => setSelection([...selection])}
			/>
			<Button onClick={addEmptyDisk} title="Add Empty ADF" />
			{isSubmitted && (
				<Notification
					note={
						submitIsOkay
							? {
								type: NoteType.Success,
								message: "Disks created!",
							}
							: {
								type: NoteType.Error,
								message: "Some disks were not created.",
							}
					}
				/>
			)}
			{disks.length > 0 && (
				<DiskComposition
					disks={disks}
					onDisksEdited={(disks) => setDisks(disks)}
					allowSubmit={!isSubmitting}
					onSubmit={submit}
				/>
			)}
		</div>
	)
}

class DiskDescriptor {
	public name: string = ""
	public label: string = ""
	public contents: FileOp[] = []

	public error: string = ""
	public done: boolean = false
	public key: number = 0

	public setName(v: string): void {
		this.name = v
	}

	public setLabel(v: string): void {
		this.label = v
	}
}

interface FileOp {
	name: string
	start?: number
	length?: number
	rename?: string
}

function getFileOpDisplayName(op: FileOp) {
	return op.rename || op.name
}

interface DiskCompositionProps {
	disks: DiskDescriptor[]
	onDisksEdited: (disks: DiskDescriptor[]) => void
	allowSubmit: boolean
	onSubmit: () => void
}

const DiskComposition = ({
	disks,
	onDisksEdited,
	allowSubmit,
	onSubmit,
}: DiskCompositionProps) => {
	return (
		<div>
			<Button
				purpose="submit"
				onClick={onSubmit}
				disabled={!allowSubmit}
				title="Submit"
			/>
			<Button
				onClick={() => onDisksEdited([])}
				title="Discard All"
			/>
			{disks.map((disk: DiskDescriptor) =>
				<DiskCompositor
					key={disk.key}
					disk={disk}
					onDiscard={() => onDisksEdited(disks.filter(d => d.key != disk.key))}
					onEdited={() => onDisksEdited([...disks])}
				/>
			)}
		</div>
	)
}

interface DiskCompositorProps {
	disk: DiskDescriptor
	onDiscard: () => void
	onEdited: () => void
}

const DiskCompositor = ({
	disk,
	onDiscard,
	onEdited,
}: DiskCompositorProps) => {
	if (disk.done) {
		return (
			<Notification
				note={{
					type: NoteType.Success,
					message: "Disk '" + disk.name + "' done!",
				}}
			/>
		)
	}

	return (
		<DiskForm
			name={disk.name}
			label={disk.label}
			contents={disk.contents}
			error={disk.error}
			onDiscard={onDiscard}
			onNameEdited={(name: string) => {
				disk.setName(name)
				onEdited()
			}}
			onLabelEdited={(label: string) => {
				disk.setLabel(label)
				onEdited()
			}}
		/>
	)
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

const DiskForm = (props: DiskFormProps) => {
	const { name, label, error, contents } = props
	const [nameError, setNameError] = useState("")

	function validateDiskName() {
		request
			.head("/api/adf/image/" + name + ".adf")
			.end((err, res) => {
				if (res.status == 404) {
					// This is good! Stop processing.
					setNameError("")
				} else if (res.status == 200) {
					setNameError("File already exists")
				} else {
					const message: string = err ? errorToString(err) : "unknown error"
					setNameError(message)
				}
			})
	}

	useEffect(validateDiskName, [name])

	return (
		<div
			css={
				[
					skin.Pane,
					{
						margin: "1em",
					},
				]
			}
		>
			<div css={{position: "absolute", right: 0, top: 0}} >
				<Button onClick={props.onDiscard} title="X" />
			</div>
			{error && error.length > 0 && (
				<Notification note={{type: NoteType.Error, message: error}} />
			)}
			<Form>
				<FormItem
					label="Name"
					hint=".adf"
					note={
						nameError ? {
							type: NoteType.Error,
							message: nameError
						} : undefined
					}
				>
					<LineInput
						css={{width: "100%"}}
						value={name}
						onChange={e => props.onNameEdited(e.target.value)}
					/>
				</FormItem>
				<FormItem label="Label">
					<LineInput
						css={{width: "100%"}}
						value={label}
						onChange={e => props.onLabelEdited(e.target.value)}
					/>
				</FormItem>
				<FormItem label="Contents">
					<List
						css={{outline: "unset", maxHeight: "800px"}}
						listing={contents.map(getFileOpDisplayName)}
					/>
				</FormItem>
			</Form>
		</div>
	)
}

class Distributor {
	private static readonly ADF_SIZE = 880 * 1024
	private static readonly BUFFER_SPACE = 15 * 1024
	private static readonly META_SPACE_PER_FILE = 2 * 1024
	private static readonly MAX_SIZE = Distributor.ADF_SIZE - Distributor.BUFFER_SPACE
	private static readonly MAX_FILENAME = 30
	private files: FileTableEntry[]

	constructor(files: FileTableEntry[]) {
		this.files = files.slice()
	}

	/**
	 * Return value is a two-dimensional array of FileOp. The first
	 * dimension are disks, the second dimension are files that fit
	 * on each of the disks.
	 */
	public distribute(): FileOp[][] {
		const distribution: FileOp[][] = []

		// 1. Sort files by size descending
		const sorted = this.files.sort((a, b) => b.size - a.size)

		// 2. Split files that won't fit on a disk
		const toobig = sorted.filter(e => e.size > Distributor.MAX_SIZE)
		const splits: FileOp[] = []
		toobig.forEach(bigfile => {
			const partsize = Distributor.MAX_SIZE
			const parts_count = Math.ceil(bigfile.size / partsize)
			for (let i = 0; i < parts_count; ++i) {
				const start = i * partsize
				const end = start + partsize
				const length = (end > bigfile.size) ?
					(bigfile.size - start) : Distributor.MAX_SIZE
				splits.push({
					name: bigfile.name, start, length,
					rename: this.trimFilename(bigfile.name, "." + Strings.leftpad("" + (i + 1), "0", 3))
				})
			}
		})

		// 3. Place the split files to fill the disks
		splits.forEach(op => distribution.push([op]))

		// 4. Files that fit onto disks should be distributed
		//    to try to fill up the whole disk
		const fitting = sorted.filter(e => e.size <= Distributor.MAX_SIZE)
		while (fitting.length > 0) {
			const disk: FileTableEntry[] = []
			const takenspace = () => {
				return Distributor.META_SPACE_PER_FILE * (disk.length + 1)
					+ disk.reduce((prev, cur) => prev + cur.size, 0)
			}
			const freespace = () => Distributor.MAX_SIZE - takenspace()
			// 4.1. Start with largest file and put it on to the disk
			const file = fitting.shift()
			if (file != null) {
				disk.push(file)
			}
			while (fitting.length > 0) {
				// 4.2. Find next largest file that still fits
				//      and put it on the disk
				const idx = fitting.findIndex(e => e.size <= freespace())
				if (idx >= 0) {
					const file = fitting[idx]
					fitting.splice(idx, 1)
					disk.push(file)
				} else {
					break
				}
			}
			distribution.push(disk.map(f => {return {
				name: f.name,
				rename: this.trimFilename(f.name)}
			}))
		}

		return distribution
	}

	private trimFilename(name: string, trail?: string): string {
		trail = trail || ""
		const maxLen = Distributor.MAX_FILENAME
		if ((name + trail).length < maxLen) {
			return name + trail
		} else {
			const fitNameLen = maxLen - trail.length
			return name.substr(0, fitNameLen) + trail
		}
	}
}

export default AdfWizard
