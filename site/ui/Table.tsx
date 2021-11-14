import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { rgba } from 'polished';

import * as skin from '../skin';
import * as responsive from '../responsive';

const tableHeaderBorder = "1px solid black";

export const Table = styled.table({
	color: skin.page.background,
	background: "white",
	border: "3px solid gray",
	borderSpacing: "0px",
	padding: "0px",
	marginBottom: "4px",
	[`@media (${responsive.tightScreen})`]: {
		fontSize: "0.9em",
	},
	[`@media (${responsive.tighterScreen})`]: {
		fontSize: "0.75em",
	},

	'thead tr': {
		background: rgba(skin.page.background, 0.25)
	},
});

export const TableRecord = styled.tr({
	"&:nth-child(even)": {
		background: rgba(skin.page.background, 0.1),
	}
});

interface HeaderCellProps {
	rightmost?: boolean,
	children?: React.ReactNode,
	className?: string,
}

export const HeaderCell = (props: HeaderCellProps) =>
	<th css={{
		borderBottom: tableHeaderBorder,
		borderRight: props.rightmost ? "none" : tableHeaderBorder,
		padding: "0px 10px",
		paddingTop: "2px",
	}} {...props} />;

export const LabelCell = styled.th({
	fontWeight: "normal",
	textAlign: "center",
	padding: "4px 10px",
});

export const DataCell = styled.td({
	padding: "4px 2px",
	verticalAlign: "middle",
});

export const SelectCell = css({
	padding: "2px",
	textAlign: "center",
	width: "21px",
	borderRight: "0px",
	verticalAlign: "middle",
});

export const HeaderSelectCell = styled(HeaderCell)<HeaderCellProps>(SelectCell);

export const CellPane = (props: object) =>
	<div css={{
		display: "flex",
		alignItems: "center",
		paddingRight: "0.25em",
		wordBreak: "break-word",
	}} {...props} />

export const TableLink = css({
	cursor: "pointer",
	textDecoration: "none",
	color: "blue",
	"&:hover": {
		color: "dodgerblue",
	},
	"&:visited": {
		color: "blue",
	},
});
