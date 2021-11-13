import * as React from 'react';
import { Component } from 'react';
import styled from '@emotion/styled';

import { ActionSet } from './Actions';
import * as res from '../res';
import { Button } from './ui';

interface ListingProps {
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
	"&:nth-child(even)": {
		backgroundColor: "#fff2",
	},
})

export default class Listing extends Component<ListingProps> {
	render() {
		const { props } = this;
		if (props.listing.length > 0) {
			return (<ul css={{
				overflow: "auto",
				outline: "1px dashed black",
				paddingRight: "5px",
				maxHeight: "200px"
			}} {...props}>
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
			this.swapListing(entry_idx, entry_idx - 1);
		}
	}

	private moveDown(entry_idx: number): void {
		if (entry_idx < this.props.listing.length - 1) {
			this.swapListing(entry_idx, entry_idx + 1);
		}
	}

	private swapListing(idx_a: number, idx_b: number): void {
		let listing = this.props.listing.slice();
		listing = this.swap(listing, idx_a, idx_b);
		this.props.onOrderChange(listing);
	}

	private swap<T>(listing: T[], a: number, b: number): T[] {
		let elem = listing[a];
		listing[a] = listing[b];
		listing[b] = elem;
		return listing
	}
}
