import { useEffect, useState } from 'react';
import * as request from 'superagent';

import FileTable, { FileTableEntry } from './FileTable';
import { ErrorLabel, Labelled } from '../ui/Label';
import { Link } from '../ui/Link';
import { formatSize } from '../ui/ui';

interface MountImageProps {
	name: string
	showName?: boolean
	refreshCounter: number
}

interface Load {
	name: string
	loading: boolean
	error?: Error
};

interface LoadContents extends Load {
	listing?: FileTableEntry[]
};

interface LoadStat extends Load {
	stat?: FileTableEntry
};

export const MountImage = (props: MountImageProps) => {
	const [loadContents, setLoadContents] = useState<LoadContents>({
		name: props.name,
		loading: true,
	});
	const [loadStat, setLoadStat] = useState<LoadStat>({
		name: props.name,
		loading: true,
	});

	let { showName } = props;
	if (showName === undefined)
		showName = true;

	function contentsApi(): string {
		return "/api/mountimg/" + props.name + "/contents";
	}

	function downloadApi(): string {
		return "/api/mountimg/" + props.name;
	}

	function statApi(): string {
		return "/api/mountimg/" + props.name + "/stat";
	}

	useEffect(() => {
		const isReset = props.name != loadContents.name;
		setLoadStat({
			...loadStat,
			name: props.name,
			loading: true,
			...(isReset && {
				stat: null,
				error: null,
			}),
		});
		setLoadContents({
			...loadContents,
			name: props.name,
			loading: true,
			...(isReset && {
				listing: null,
				error: null,
			}),
		});
		request.get(statApi()).end((err, res) => {
			setLoadStat({
				...loadStat,
				loading: false,
				stat: res.body,
				error: err,
			});
		});
		request.get(contentsApi()).end((err, res) => {
			setLoadContents({
				...loadContents,
				loading: false,
				listing: !err ? res.body : null,
				error: err,
			});
		})
	}, [props.name, props.refreshCounter]);

	const error = loadStat.error || loadContents.error;
	const loading = loadStat.loading || loadContents.loading
	return (<div>
		{showName && <Labelled label="Image:" contents={
			<Link href={downloadApi()}>{props.name}{loadStat.stat && ` (${formatSize(loadStat.stat.size)})`}</Link>
		} />}
		{loading && <p>Loading ...</p>}
		{error && <ErrorLabel error={error} />}
		{loadContents.listing && <FileTable listing={loadContents.listing}
			fileLinkPrefix={contentsApi()} /> }
	</div>);
};
