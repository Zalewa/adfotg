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
		this.searchPrompt = "";
		this.state = {
			title: this.getMatchMediaTitle(),
			searchPrompt: ""
		};
	}

	searchPrompt: string

	render() {
		return (
			<div className="title">
				<div className="title__row">
				<div className="title__section title__section--fill">
					<AppLink className="title__main" exact to={HOME_LINK}>{this.state.title}</AppLink>
				</div>
				<div className="title__section">
					<SpaceInfo refresh={this.props.refresh} />
					<HealthBar />
					<div className="title__row">
						<a className="link" href="/help">API Help</a>
						<VersionInfo />
					</div>
				</div>
				</div>
				<div className="title__row">
					<div className="title__section title__section--fill">
						<AppLink to={ADFWIZARD_LINK}>Create ADFs</AppLink>
					</div>
					{this.renderSearch()}
				</div>
			</div>
		);
	}

	private renderSearch(): JSX.Element {
		if (this.props.canSearch) {
			return (<div className="title__section">
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

	componentWillReceiveProps(props: TitleProps) {
		this.searchPrompt = props.search;
		this.setState({searchPrompt: props.search});
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
		this.searchPrompt = searchPrompt;
		this.setState({searchPrompt});
	}

	@boundMethod
	private onSearchSubmitted(): void {
		this.props.onSearch(this.searchPrompt);
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
		return (<div className="versionInfo">
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
		return (<div className="space-info">
			<table className="table table--no-margin">
				<thead>
					<tr className="table__header">
						<th className="table__header-cell table__header-cell--left">Mount Point</th>
						<th className="table__header-cell">Available</th>
						<th className="table__header-cell table__header-cell--right">Total Space</th>
					</tr>
				</thead>
				<tbody>
					{this.renderStats()}
				</tbody>
			</table>
			</div>);
	}

	componentWillReceiveProps(props: TitleProps) {
		if (this.props.refresh !== props.refresh) {
			this.refresh();
		}
	}

	componentWillMount() {
		this.refresh();
	}

	private renderStats(): JSX.Element[] {
		let el: JSX.Element[] = [];
		this.state.fsStats.forEach((stat: FsStats) => {
			el.push(<tr className="table__record" key={stat.name}>
				<th className="table__label-cell">{stat.name}</th>
				<td className="table__data-cell">{formatSize(stat.avail)}</td>
				<td className="table__data-cell">{formatSize(stat.total)}</td>
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
		className={props.className ? props.className : "app-link"}
		activeClassName="app-link--selected"
		to={props.to}>
		{props.children}
	</NavLink>
}
