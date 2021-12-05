import { Component } from 'react';
import styled from '@emotion/styled';

import { ActionSet } from '../component/Actions';
import * as res from '../res';
import { Button } from './Button';

interface ListProps {
	listing: string[]
	className?: string
	onOrderChange?: (listing: string[]) => void
}

const Record = styled.li({
	display: "flex",
	alignItems: "baseline",
	paddingTop: "2px",
	paddingLeft: "2px",
	wordBreak: "break-word",
	"&:nth-of-type(even)": {
		backgroundColor: "#fff2",
	},
})

export default class List extends Component<ListProps> {
	render() {
		const { props } = this;
		if (props.listing.length > 0) {
			return (<ul css={{
				overflow: "auto",
				outline: "1px dashed black",
				paddingRight: "5px",
				maxHeight: "200px"
			}} className={props.className}>
				{this.renderRecords()}
			</ul>);
		} else {
			return null;
		}
	}

	private renderRecords(): JSX.Element[] {
		const { props } = this;
		return props.listing.map((entry: string, idx: number) => {
			return <Record key={entry}>{entry}{this.renderActions(idx)}</Record>;
		});
	}

	private renderActions(entry_idx: number): JSX.Element {
		if (this.props.onOrderChange) {
			return (<ActionSet right>
				<Button table icon={res.arrow_up} title="Move up"
					onClick={() => this.moveUp(entry_idx)} />
				<Button table icon={res.arrow_down} title="Move down"
					onClick={() => this.moveDown(entry_idx)} />
			</ActionSet>);
		}
		return null;
	}

	private moveUp(entry_idx: number): void {
		if (entry_idx > 0) {
			this.swapRecord(entry_idx, entry_idx - 1);
		}
	}

	private moveDown(entry_idx: number): void {
		if (entry_idx < this.props.listing.length - 1) {
			this.swapRecord(entry_idx, entry_idx + 1);
		}
	}

	private swapRecord(idx_a: number, idx_b: number): void {
		let listing = this.props.listing.slice();
		listing = this.swap(listing, idx_a, idx_b);
		this.props.onOrderChange(listing);
	}

	private swap<T>(records: T[], a: number, b: number): T[] {
		let elem = records[a];
		records[a] = records[b];
		records[b] = elem;
		return records
	}
}
