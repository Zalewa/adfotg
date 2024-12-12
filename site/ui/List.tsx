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

function swap<T>(records: T[], a: number, b: number): T[] {
	let elem = records[a];
	records[a] = records[b];
	records[b] = elem;
	return records
}

const List = (props: ListProps) => {
	if (props.listing.length <= 0)
		return null;

	function swapRecord(idx_a: number, idx_b: number): void {
		let listing = props.listing.slice();
		listing = swap(listing, idx_a, idx_b);
		props.onOrderChange(listing);
	}

	function moveUp(entry_idx: number): void {
		if (entry_idx > 0) {
			swapRecord(entry_idx, entry_idx - 1);
		}
	}

	function moveDown(entry_idx: number): void {
		if (entry_idx < props.listing.length - 1) {
			swapRecord(entry_idx, entry_idx + 1);
		}
	}

	const Actions = (props: { idx: number } & ListProps) => {
		if (props.onOrderChange) {
			return (<ActionSet right>
				<Button table icon={res.arrow_up} title="Move up"
					onClick={() => moveUp(props.idx)} />
				<Button table icon={res.arrow_down} title="Move down"
					onClick={() => moveDown(props.idx)} />
			</ActionSet>);
		}
		return null;
	}

	return (<ul css={{
		overflow: "auto",
		outline: "1px dashed black",
		paddingRight: "5px",
		maxHeight: "200px"
	}} className={props.className}>
		{props.listing.map((entry: string, idx: number) => (
			<Record key={entry}>
				{entry}
				<Actions {...props} idx={idx} />
			</Record>
		))}
	</ul>);
}

export default List;
