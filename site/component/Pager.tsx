import { Component } from 'react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { boundMethod } from 'autobind-decorator';

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
	selected: boolean;
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

PageLink.defaultProps = {selected: false};

export default class Pager extends Component<PagerProps> {
	render() {
		if (!this.hasPages())
			return null;
		return (<div css={css({
			display: "flex",
			flexWrap: "wrap",
			justifyContent: "space-evenly",
		})}>
			{this.renderLeft()}
			{this.renderNumbers()}
			{this.renderRight()}
		</div>);
	}

	private renderLeft(): JSX.Element {
		if (this.hasLeft()) {
			return (<PagerLeft>
				<PageLink onClick={() => this.change(0)}>&lt;&lt;</PageLink>
				<PageLink onClick={() => this.change(this.page() - 1)}>&lt;</PageLink>
			</PagerLeft>);
		} else {
			return <PagerLeft />
		}
	}

	private renderRight(): JSX.Element {
		if (this.hasRight()) {
			return (<PagerRight>
				<PageLink onClick={() => this.change(this.page() + 1)}>&gt;</PageLink>
				<PageLink onClick={() => this.change(this.lastPage())}>&gt;&gt;</PageLink>
			</PagerRight>);
		} else {
			return <PagerRight />
		}
	}

	private renderNumbers(): JSX.Element[] {
		let links: JSX.Element[] = [];
		for (let page = 0; page < this.numPages(); ++page) {
			links.push(<PageLink key={page}
					selected={page == this.page()}
					onClick={() => this.change(page)}>
				{page + 1}
			</PageLink>);
		}
		return links;
	}

	@boundMethod
	private change(pageNum: number) {
		const page = new Page(this.startAtPage(pageNum), this.limit());
		this.props.onPageChanged(page);
	}

	private hasPages(): boolean {
		return this.total() > this.limit();
	}

	private hasLeft(): boolean {
		return this.start() > 0;
	}

	private hasRight(): boolean {
		return this.total() > 0 &&
			this.start() + this.limit() < this.total();
	}

	private numPages(): number {
		const { total, page } = this.props;
		if (page.limit <= 0)
			return 0;
		return total / page.limit;
	}

	private page(): number {
		if (this.limit() <= 0 || this.start() <= 0)
			return 0;
		return Math.floor(this.start() / this.limit());
	}

	private lastPage(): number {
		if (this.total() <= 0 || this.limit() <= 0)
			return 0;
		return Math.floor((this.total() - 1) / this.limit());
	}

	private startAtPage(page: number): number {
		return page * this.limit();
	}

	private start(): number {
		return this.props.page.start;
	}

	private limit(): number {
		return this.props.page.limit;
	}

	private total(): number {
		return this.props.total;
	}
}
