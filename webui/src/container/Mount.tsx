import { useEffect, useState, type ReactNode } from 'react'
import * as request from 'superagent'

import { ActionSet } from '@/component/Actions'
import { type FileTableEntry } from '@/component/FileTable'
import { MountImagesTable } from '@/container/StorageTables'
import { MountImage } from '@/component/MountImage'
import { dispatchRequestError } from '@/component/Notifier'
import { Button } from '@/ui/Button'
import { ErrorLabel } from '@/ui/Label'
import { AppLink } from '@/ui/Link'
import { Section, Subsection } from '@/ui/Section'
import { TableLink } from '@/ui/Table'
import * as resrc from '@/res'
import * as skin from '@/skin'


const MountStatus = {
	Mounted: "mounted",
	Unmounted: "unmounted",
	NoImage: "no_image",
	BadImage: "bad_image",
	OtherImageMounted: "other_image_mounted",
} as const

export type MountStatus = typeof MountStatus[keyof typeof MountStatus]

const rescueStatuses: readonly MountStatus[] = [
	MountStatus.NoImage,
	MountStatus.BadImage,
	MountStatus.OtherImageMounted,
]

interface MountInfo {
	error?: string
	mountStatus: MountStatus | null
	mountedImageName: string
}

interface MountProps {
	refreshToken: number
	search: string
}

const PAGE_SIZE = 50

const Mount = (props: MountProps) => {
	const [imagesSelection, setImagesSelection] = useState<FileTableEntry[]>([])
	const [mountInfo, setMountInfo] = useState<MountInfo>()

	function mountImage(image: string): void {
		request
			.post("/api/mount/" + image)
			.end((err) => {
				dispatchRequestError(err)
				refresh()
			})
	}

	function unmountImage(): void {
		request
			.delete("/api/mount")
			.end((err) => {
				dispatchRequestError(err)
				refresh()
			})
	}

	function renderName(file: FileTableEntry): ReactNode {
		return (
			<AppLink
				css={TableLink}
				to={`/inspect/mountimg/${file.name}`}
			>
				{file.name}
			</AppLink>
		)
	}

	function renderFileActions(file: FileTableEntry): ReactNode {
		const mountStatus = mountInfo && mountInfo.mountStatus
		function canMount() {
			return mountStatus === MountStatus.Unmounted || mountStatus === MountStatus.Mounted
		}
		function cannotMountReason() {
			if (mountStatus == null)
				return "Cannot mount as current mount status is unknown."
			else
				return "Current mount status forbids mounting an image."
		}
		const mountTitle = canMount() ? "Mount this image" : cannotMountReason()

		return (
			<ActionSet>
				<Button
					table
					title={mountTitle}
					icon={resrc.usb_icon_horz}
					disabled={!canMount()}
					onClick={() => mountImage(file.name)}
				/>
			</ActionSet>
		)
	}

	function refresh(): void {
		request
			.get("/api/mount")
			.end((err, res) => {
				dispatchRequestError(err)
				const mountStatus: MountStatus | null = !err
					? res.body?.status
					: null
				setMountInfo({
					mountStatus: mountStatus,
					error: err ? err.toString() : res.body?.error,
					mountedImageName: res.body?.file
				})
			})
	}

	useEffect(refresh, [props.refreshToken])

	return (
		<Section title="Mounting">
			<MountArea
				mountInfo={mountInfo}
				onUnmount={unmountImage}
				refreshCounter={props.refreshToken}
			/>
			<MountImagesTable
				search={props.search}
				refresh={props.refreshToken}
				pageSize={PAGE_SIZE}
				selected={imagesSelection}
				onSelected={(selection) => setImagesSelection([...selection])}
				onRenderFileActions={renderFileActions}
				onRenderName={renderName}
			/>
		</Section>
	)
}

interface MountAreaProps {
	refreshCounter: number
	mountInfo?: MountInfo
	onUnmount: () => void
}

const MountArea = (props: MountAreaProps) => {
	return (
		<Subsection title="Mounted Image">
			{props.mountInfo && (
				<>
					<MountStatusDisplay {...props.mountInfo} />
					{props.mountInfo.mountedImageName &&
						<MountImage
							showName={false}
							name={props.mountInfo.mountedImageName}
							refreshCounter={props.refreshCounter}
						/>
					}
					<MountActions
						mountStatus={props.mountInfo.mountStatus}
						onUnmount={props.onUnmount}
					/>
				</>
			)}
		</Subsection>
	)
}

interface MountStatusProps {
	error?: string
	mountStatus: MountStatus | null
	mountedImageName: string
}

type Display = {
	text: string
	color: string
}

const MountStatusDisplay = (props: MountStatusProps) => {
	function statusDisplay(): Display {
		switch (props.mountStatus) {
			case MountStatus.Mounted:
				return {text: "Mounted: ", color: "lime"}
			case MountStatus.Unmounted:
				return {text: "Not mounted", color: "gray"}
			case MountStatus.NoImage:
				return {text: "Image is missing", color: skin.dangerColor}
			case MountStatus.BadImage:
				return {
					text: "Image error: " + props.error,
					color: skin.dangerColor,
				}
			case MountStatus.OtherImageMounted:
				return {
					text: "An image outside the app is mounted.",
					color: skin.dangerColor,
				}
			default:
				return {text: "Unknown State", color: "gray"}
		}
	}

	const {color, text}: Display = statusDisplay()
	return (
		<div>
			<span css={{color}}>{text}</span>
			{props.mountedImageName &&
				<span>{props.mountedImageName}</span>}
			{props.error && <ErrorLabel error={props.error} />}
		</div>
	)
}

interface MountActionsProps {
	mountStatus: MountStatus | null,
	onUnmount: ()=>void,
}

const MountActions = ({
	mountStatus,
	onUnmount,
}: MountActionsProps) => {
	const isMounted = mountStatus == MountStatus.Mounted
	const needsRescue = mountStatus != null && rescueStatuses.includes(mountStatus)
	const anyActions = isMounted || needsRescue

	return (
		<div css={{
			marginRight: anyActions ? "0.25em" : "0em",
		}}>
			{isMounted && !needsRescue && (
				<Button title="Unmount" onClick={onUnmount} />
			)}
			{needsRescue && (
				<Button title="Force unmount" onClick={onUnmount} />
			)}
		</div>
	)
}

export default Mount
