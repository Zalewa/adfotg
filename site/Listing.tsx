import * as React from 'react';
import { Component } from 'react';

import { ActionSet } from './Actions';
import * as res from './res';
import { Icon } from './ui';

interface ListingProps {
	listing: string[]
	className?: string
	onOrderChange?: (listing: string[]) => void
}

export default class Listing extends Component<ListingProps> {
	render() {
		const { props } = this;
		if (props.listing.length > 0) {
			return (<ul className={"listing " + (props.className ? props.className : "")}>
				{this.renderRecords()}
			</ul>);
		} else {
			return null;
		}
	}

	private renderRecords(): JSX.Element[] {
		const { props } = this;
		const customEntryClass = (props.className ? props.className + "__entry" : "");
		return props.listing.map((entry: string, idx: number) => {
			return <li className={"listing__entry " + customEntryClass}
				key={entry}>{entry}{this.renderActions(idx)}</li>;
		});
	}

	private renderActions(entry_idx: number): JSX.Element {
		if (this.props.onOrderChange) {
			return (<ActionSet right>
				<button className="button button--listing button--icon-table"
					onClick={() => this.moveUp(entry_idx)}>
					<Icon table button src={res.arrow_up} />
				</button>
				<button className="button button--listing button--icon-table"
					onClick={() => this.moveDown(entry_idx)}>
					<Icon table button src={res.arrow_down} />
				</button>
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
