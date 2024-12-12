import { ReactNode } from 'react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';

import { LinkText, LinkTextProps } from '../ui/Link';

export class Page {
	public readonly start: number = 0
	public readonly limit: number = 100

	constructor(start?: number, limit?: number) {
		if (start)
			this.start = start;
		if (limit)
			this.limit = limit;
	}
}

interface PagerProps {
	page: Page
	total: number
	onPageChanged: (page: Page)=>void
}

const PagerLeft = styled.div({
	minWidth: "64px",
});

const PagerRight = styled.div({
	minWidth: "64px",
	textAlign: "right"
});

interface PagerPageLinkProps extends LinkTextProps {
	selected?: boolean;
};

const PageLink = (props: PagerPageLinkProps) => (
	<LinkText css={[
		{
			margin: "0 0.125em",
			fontSize: "1.5em"
		},
		props.selected && {
			fontWeight: "bold",
			textDecoration: "underline"
		}
	]}
	{...props}
	/>
);

const Pager = (props: PagerProps) => {
	if (!hasPages())
		return null;

	function renderLeft(): ReactNode {
		if (hasLeft()) {
			return (<PagerLeft>
				<PageLink onClick={() => change(0)}>&lt;&lt;</PageLink>
				<PageLink onClick={() => change(currentPage() - 1)}>&lt;</PageLink>
			</PagerLeft>);
		} else {
			return <PagerLeft />
		}
	}

	function renderRight(): ReactNode {
		if (hasRight()) {
			return (<PagerRight>
				<PageLink onClick={() => change(currentPage() + 1)}>&gt;</PageLink>
				<PageLink onClick={() => change(lastPage())}>&gt;&gt;</PageLink>
			</PagerRight>);
		} else {
			return <PagerRight />
		}
	}

	function renderNumbers(): ReactNode {
		let links: JSX.Element[] = [];
		for (let page = 0; page < numPages(); ++page) {
			links.push(<PageLink key={page}
					selected={page == currentPage()}
					onClick={() => change(page)}>
				{page + 1}
			</PageLink>);
		}
		return links;
	}

	function change(pageNum: number) {
		const page = new Page(startAtPage(pageNum), limit());
		props.onPageChanged(page);
	}

	function hasPages(): boolean {
		return total() > limit();
	}

	function hasLeft(): boolean {
		return start() > 0;
	}

	function hasRight(): boolean {
		return total() > 0 &&
			start() + limit() < total();
	}

	function numPages(): number {
		const { total, page } = props;
		if (page.limit <= 0)
			return 0;
		return total / page.limit;
	}

	function currentPage(): number {
		if (limit() <= 0 || start() <= 0)
			return 0;
		return Math.floor(start() / limit());
	}

	function lastPage(): number {
		if (total() <= 0 || limit() <= 0)
			return 0;
		return Math.floor((total() - 1) / limit());
	}

	function startAtPage(page: number): number {
		return page * limit();
	}

	function start(): number {
		return props.page.start;
	}

	function limit(): number {
		return props.page.limit;
	}

	function total(): number {
		return props.total;
	}

	return (<div css={css({
		display: "flex",
		flexWrap: "wrap",
		justifyContent: "space-evenly",
	})}>
		{renderLeft()}
		{renderNumbers()}
		{renderRight()}
	</div>);
}

export default Pager;
