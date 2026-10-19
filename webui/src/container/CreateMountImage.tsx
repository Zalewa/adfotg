import { useEffect, useState } from 'react'
import * as request from 'superagent'

import { Actions, ActionSet } from '@/component/Actions'
import List from '@/ui/List'
import { Button } from '@/ui/Button'
import { LineInput } from '@/ui/Input'
import { ErrorLabel } from '@/ui/Label'
import * as resrc from '@/res'
import { sorted } from '@/strings'


export interface CreateMountImageProps {
	adfs: string[]
	onDone?: ()=>void
}

const CreateMountImage = (props: CreateMountImageProps) => {
	const [sortedAdfs, setSortedAdfs] = useState(() => sorted(props.adfs))
	const [imageName, setImageName] = useState("")
	const [isRefreshing, setIsRefreshing] = useState(true)
	const [error, setError] = useState(undefined)

	function create(): void {
		if (!imageName)
			return

		request
			.put("/api/mountimg/" + imageName + "/pack_adfs")
			.send({adfs: sortedAdfs})
			.end((err) => {
				if (err) {
					setError(err)
				} else {
					setError(undefined)
					if (props.onDone)
						props.onDone()
				}
		})
	}

	function fetch(): void {
		request
			.get("/api/adf/std")
			.end((err, res) => {
				if (err) {
					setError(err)
				} else {
					const stdAdfs = res.body
					setSortedAdfs(adfs => stdAdfs.concat(adfs))
				}
				setIsRefreshing(false)
			})
	}

	useEffect(fetch, [])

	return (
		<div>
			{isRefreshing && <Refreshing />}
			{!isRefreshing && error && <ErrorLabel error={error} />}
			{!isRefreshing && (
				<Workspace
					adfs={sortedAdfs}
					onAdfsOrderChange={setSortedAdfs}
					imageName={imageName}
					onImageNameChange={setImageName}
					onCreate={create}
				/>
			)}
		</div>
	)
}

interface WorkspaceProps {
	adfs: string[]
	onAdfsOrderChange: (listing: string[]) => void
	imageName: string
	onImageNameChange: (name: string) => void
	onCreate: () => void
}

const Workspace = ({
	adfs,
	onAdfsOrderChange,
	imageName,
	onImageNameChange,
	onCreate
}: WorkspaceProps) => {
	return (
		<div>
			<span>Create Mount Image with the following ADFs:</span>
			<List
				listing={adfs}
				onOrderChange={onAdfsOrderChange}
			/>
			<Actions submit fullrow>
				<ActionSet>
					<LineInput
						autoFocus
						type="text"
						value={imageName}
						onChange={e => onImageNameChange(e.target.value)}
						onKeyDown={e => {
							if (e.key === "Enter") {
								e.stopPropagation()
								onCreate()
							}
						}}
					/>
				</ActionSet>
				<ActionSet right>
					<Button
						purpose="submit"
						onClick={() => onCreate()}
						disabled={imageName.length == 0}
						title="Create"
					/>
				</ActionSet>
			</Actions>
		</div>
	)
}

const Refreshing = () => (
	<div>
		<div>Obtaining some extra data ...</div>
		<div><img width="100%" src={resrc.loader} /></div>
	</div>
)

export default CreateMountImage
