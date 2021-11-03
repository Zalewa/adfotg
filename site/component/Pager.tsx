import * as React from 'react';
import { Component } from 'react';
import { boundMethod } from 'autobind-decorator';

import { LinkText } from './ui';

import style from './Pager.less';

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

export default class Pager extends Component<PagerProps> {
	render() {
		if (!this.hasPages())
			return null;
		return (<div className={style.pager}>
			{this.renderLeft()}
			{this.renderNumbers()}
			{this.renderRight()}
		</div>);
	}

	private renderLeft(): JSX.Element {
		if (this.hasLeft()) {
			return (<div className={style.pagerLeft}>
				<LinkText className={style.pagerPage} onClick={() => this.change(0)}>&lt;&lt;</LinkText>
				<LinkText className={style.pagerPage} onClick={() => this.change(this.page() - 1)}>&lt;</LinkText>
			</div>);
		} else {
			return <div className={style.pagerLeft} />
		}
	}

	private renderRight(): JSX.Element {
		if (this.hasRight()) {
			return (<div className={style.pagerRight}>
				<LinkText className={style.pagerPage} onClick={() => this.change(this.page() + 1)}>&gt;</LinkText>
				<LinkText className={style.pagerPage} onClick={() => this.change(this.lastPage())}>&gt;&gt;</LinkText>
			</div>);
		} else {
			return <div className={style.pagerRight} />
		}
	}

	private renderNumbers(): JSX.Element[] {
		let links: JSX.Element[] = [];
		for (let page = 0; page < this.numPages(); ++page) {
			let klass = style.pagerPage;
			if (page == this.page())
				klass += ` ${style.pagerPageSelected}`;
			links.push(<LinkText key={page} className={klass}
					onClick={() => this.change(page)}>
				{page + 1}
			</LinkText>);
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
