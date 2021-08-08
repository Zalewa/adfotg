import * as React from 'react';
import { Component } from 'react';
import { NavLink, NavLinkProps } from 'react-router-dom';
import { boundMethod } from 'autobind-decorator';
import * as request from 'superagent';

import { HealthBar } from './Health';
import { dispatchRequestError } from './Notifier';
import * as responsive from './responsive';
import { ADFWIZARD_LINK, HOME_LINK } from './routes';
import Search from './Search';
import style from './style.less';
import { Labelled, formatSize } from './ui';

interface TitleProps {
	refresh: boolean
	canSearch: boolean
	search: string
	onSearch: (s: string)=>void
}

interface TitleState {
	title: string
	searchPrompt: string
}

export default class Title extends Component<TitleProps, TitleState> {
	constructor(props: TitleProps) {
		super(props);
		this.state = {
			title: this.getMatchMediaTitle(),
			searchPrompt: props.search
		};
	}

	searchPrompt: string

	render() {
		return (
			<div className={style.title}>
				<div className={style.titleRow}>
				<div className={`${style.titleSection} ${style.titleSectionFill}`}>
					<AppLink className={style.titleMain} exact to={HOME_LINK}>{this.state.title}</AppLink>
				</div>
				<div className={style.titleSection}>
					<SpaceInfo refresh={this.props.refresh} />
					<HealthBar />
					<div className={style.titleRow}>
						<a className={style.link} href="/help">API Help</a>
						<VersionInfo />
					</div>
				</div>
				</div>
				<div className={style.titleRow}>
					<div className={`${style.titleSection} ${style.titleSectionFill}`}>
						<AppLink to={ADFWIZARD_LINK}>Create ADFs</AppLink>
					</div>
					{this.renderSearch()}
				</div>
			</div>
		);
	}

	private renderSearch(): JSX.Element {
		if (this.props.canSearch) {
			return (<div className={style.titleSection}>
				<Search text={this.state.searchPrompt}
					onEdit={this.onSearchEdited}
					onSubmit={this.onSearchSubmitted} />
			</div>);
		} else {
			return null;
		}
	}

	componentDidMount() {
		responsive.matchWidth.addListener(this.matchMedia);
	}

	componentDidUpdate(props: TitleProps) {
		if (props.search !== this.props.search) {
			this.setState({searchPrompt: this.props.search});
		}
	}

	componentWillUnmount() {
		responsive.matchWidth.removeListener(this.matchMedia);
	}

	@boundMethod
	private matchMedia(): void {
		this.setState({title: this.getMatchMediaTitle()});
	}

	private getMatchMediaTitle(): string {
		return responsive.matchWidth.matches ? "ADF OTG" : "ADF On-The-Go";
	}

	@boundMethod
	private onSearchEdited(searchPrompt: string): void {
		this.setState({searchPrompt});
	}

	@boundMethod
	private onSearchSubmitted(): void {
		this.props.onSearch(this.state.searchPrompt);
	}
}

interface VersionInfoState {
	version: string,
	yearspan: string,
	lastyear: string
}

class VersionInfo extends Component<{}, VersionInfoState> {
	state: Readonly<VersionInfoState> = {
		version: "",
		yearspan: "",
		lastyear: ""
	}

	render() {
		return (<div className={style.versionInfo}>
			<Labelled label="Version:" title={this.state.yearspan}
				contents={this.state.version + " (" + this.state.lastyear + ")"} />
		</div>);
	}

	componentDidMount() {
		request.get("/version").end((err, res) => {
			dispatchRequestError(err);
			if (!err) {
				this.setState(res.body);
			}
		})
	}
}

interface FsStats {
	name: string
	total: number
	avail: number
}

interface SpaceInfoState {
	fsStats: FsStats[]
}

class SpaceInfo extends Component<{refresh: boolean}, SpaceInfoState> {
	readonly state: SpaceInfoState = {
		fsStats: []
	}

	render() {
		return (<div className={style.spaceInfo}>
			<table className={`${style.table} ${style.tableNoMargin}`}>
				<thead>
					<tr className={style.tableHeader}>
						<th className={`${style.tableHeaderCell} ${style.tableHeaderCellLeft}`}>Mount Point</th>
						<th className={style.tableHeaderCell}>Available</th>
						<th className={`${style.tableHeaderCell} ${style.tableHeaderCellRight}`}>Total Space</th>
					</tr>
				</thead>
				<tbody>
					{this.renderStats()}
				</tbody>
			</table>
			</div>);
	}

	componentDidUpdate(props: TitleProps) {
		if (this.props.refresh !== props.refresh) {
			this.refresh();
		}
	}

	componentDidMount() {
		this.refresh();
	}

	private renderStats(): JSX.Element[] {
		let el: JSX.Element[] = [];
		this.state.fsStats.forEach((stat: FsStats) => {
			el.push(<tr className={style.tableRecord} key={stat.name}>
				<th className={style.tableLabelCell}>{stat.name}</th>
				<td className={style.tableDataCell}>{formatSize(stat.avail)}</td>
				<td className={style.tableDataCell}>{formatSize(stat.total)}</td>
			</tr>)
		});
		return el;
	}

	private refresh(): void {
		request.get("/filesystem").end((err, res) => {
			dispatchRequestError(err);
			if (!err) {
				this.setState({fsStats: res.body});
			}
		});
	}
}

const AppLink = (props: NavLinkProps & {children: string | JSX.Element[] | JSX.Element, className?: string}) => {
	return <NavLink exact={props.exact}
		className={props.className ? props.className : style.appLink}
		activeClassName={style.appLinkSelected}
		to={props.to}>
		{props.children}
	</NavLink>
}
