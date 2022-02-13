import { useState, ReactNode } from 'react';

import { FileTableEntry } from '../component/FileTable';
import { UploadTable } from './StorageTables';
import Uploader from '../component/Uploader';
import { Section } from '../ui/Section';


interface UploadProps {
	onUpload?: () => void
	selected: FileTableEntry[]
	onSelected: (entries: FileTableEntry[]) => void
	actions?: ReactNode
}

const PAGE_SIZE = 50;

export default (props: UploadProps) => {
	const [ refresh, setRefresh ] = useState(0);

	function onUpload() {
		setRefresh(refresh + 1);
		if (props.onUpload)
			props.onUpload();
	}

	return (<Section title="Upload Zone" css={{padding: "0 2em 1em 2em"}}>
		<Uploader onUpload={onUpload} />
		<UploadTable
			actions={props.actions}
			search={null}
			refresh={refresh}
			pageSize={PAGE_SIZE}
			selected={props.selected}
			onSelected={props.onSelected}
		/>
	</Section>);
}
