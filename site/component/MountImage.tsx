import { useEffect, useState } from 'react';
import * as request from 'superagent';

import FileTable, { FileTableEntry } from './FileTable';
import { ErrorLabel, Labelled } from '../ui/Label';

interface MountImageProps {
	name: string
	showName?: boolean
	refreshCounter: number
}

interface Load {
	name: string
	loading: boolean
	listing?: FileTableEntry[]
	error?: Error
};

export const MountImage = (props: MountImageProps) => {
	const [load, setLoad] = useState<Load>({
		name: props.name,
		loading: true,
	});

	let { showName } = props;
	if (showName === undefined)
		showName = true;

	function contentsApi(): string {
		return "/api/mountimg/" + props.name + "/contents";
	}

	useEffect(() => {
		const isReset = props.name != load.name;
		setLoad({
			...load,
			name: props.name,
			loading: true,
			...(isReset && {
				listing: null,
				error: null,
			}),
		});
		request.get(contentsApi()).end((err, res) => {
			setLoad({
				...load,
				loading: false,
				listing: !err ? res.body : null,
				error: err,
			})
		})
	}, [props.name, props.refreshCounter]);

	return (<div>
		{showName && <Labelled label="Image:" contents={props.name} />}
		{load.loading && <p>Loading ...</p>}
		{load.error && <ErrorLabel error={load.error} />}
		{load.listing && <FileTable listing={load.listing}
			fileLinkPrefix={contentsApi()} /> }
	</div>);
};
