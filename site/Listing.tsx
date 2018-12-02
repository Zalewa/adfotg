import * as React from 'react';
import { Component } from 'react';

interface ListingProps {
	listing: string[]
	className?: string
}

const Listing = (props: ListingProps) => {
	let lines: JSX.Element[] = [];
	if (props.listing) {
		const customEntryClass = (props.className ? props.className + "__entry" : "");
		props.listing.forEach((entry: string) => {
			lines.push(<li className={"listing__entry " + customEntryClass}
				key={entry}>{entry}</li>);
		});
	}
	if (lines.length > 0) {
		return (<ul className={"listing " + (props.className ? props.className : "")}>
			{lines}
		</ul>);
	} else {
		return null;
	}
}
export default Listing;
