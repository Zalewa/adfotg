import * as React from 'react';
import { Component } from 'react';

export interface FileTableEntry {
	name: string,
	mtime: number,
	size: number;
}

interface FileTableProps {
	listing: FileTableEntry[]
}

export default class FileTable extends Component<FileTableProps> {
	render() {
		let rows: JSX.Element[] = [];
		if (this.props.listing) {
			this.props.listing.forEach((e: FileTableEntry) => {
				rows.push(<FileTableRow {...e} key={e.name} />);
			});
		}
		return (
			<table className="fileTable">
				<thead>
					<tr>
						<td>Name</td>
						<td>Size</td>
						<td>Modified Date</td>
					</tr>
				</thead>
				<tbody>
					{rows}
				</tbody>
			</table>
		);
	}
}

const FileTableRow = (props: FileTableEntry) => {
	return <tr>
		<td>{props.name}</td>
		<td>{props.size}</td>
		<td>{props.mtime}</td>
	</tr>
};
