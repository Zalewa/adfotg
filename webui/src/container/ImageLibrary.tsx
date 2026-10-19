import { useState, type ReactNode } from 'react'
import * as request from 'superagent'

import { type FileTableEntry } from '@/component/FileTable'
import { AdfTable } from '@/container/StorageTables'
import CreateMountImage from '@/container/CreateMountImage'
import { dispatchRequestError } from '@/component/Notifier'
import * as res from '@/res'
import { Button } from '@/ui/Button'
import Modal from '@/ui/Modal'
import { Section } from '@/ui/Section'

interface ImageLibraryProps {
	onCreatedImage: ()=>void
	onMountedImage: ()=>void
	refreshToken: number
	search: string
}

const PAGE_SIZE = 50

const ImageLibrary = (props: ImageLibraryProps) => {
	const [isCreatingImage, setIsCreatingImage] = useState(false)
	const [selection, setSelection] = useState<FileTableEntry[]>([])

	function renderActions(): ReactNode {
		return (
			<Button
				onClick={() => setIsCreatingImage(true) }
				disabled={selection.length == 0}
				title="Create Mount Image"
			/>
		)
	}

	function renderFileActions(file: FileTableEntry): ReactNode {
		return (
			<Button
				table
				title="Quick mount"
				icon={res.usb_icon_horz}
				onClick={() => quickMount(file.name)}
			/>
		)
	}

	function quickMount(file: string): void {
		request.post("/api/quickmount/adf/" + file).end((err) => {
			dispatchRequestError(err)
			if (!err && props.onMountedImage) {
				props.onMountedImage()
			}
		})
	}

	function createImage(): void {
		props.onCreatedImage()
		setIsCreatingImage(false)
	}

	return (
		<Section title="ADFs">
			{isCreatingImage && (
				<Modal onClose={() => setIsCreatingImage(false) }>
					<CreateMountImage
						adfs={selection.map(e => e.name)}
						onDone={createImage}
					/>
				</Modal>
			)}
			<AdfTable
				actions={renderActions()}
				search={props.search}
				refresh={props.refreshToken}
				pageSize={PAGE_SIZE}
				selected={selection}
				onSelected={entries => setSelection([...entries])}
				onRenderFileActions={renderFileActions}
			/>
		</Section>
	)
}

export default ImageLibrary
