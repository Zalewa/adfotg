import * as React from 'react';
import { Component } from 'react';
import { NavLink, NavLinkProps } from 'react-router-dom';
import * as request from 'superagent';

import { HealthBar } from './Health';
import { ADFWIZARD_LINK, HOME_LINK } from './routes';
import { dispatchRequestError } from './Notifier';
import { Labelled, formatSize } from './ui';

interface TitleProps {
	refresh: boolean
}

export default class Title extends Component<TitleProps> {
	render() {
		return (
			<div className="title">
				<div className="title__row">
				<div className="title__section">
					<AppLink className="title__main" exact to={HOME_LINK}>ADF On-The-Go</AppLink>
					<AppLink to={ADFWIZARD_LINK}>Create ADFs</AppLink>
				</div>
				<div className="title__section title__section--right">
					<SpaceInfo refresh={this.props.refresh} />
					<HealthBar />
					<div className="title__row">
						<a className="link" href="/help">API Help</a>
						<VersionInfo />
					</div>
				</div>
				</div>
			</div>
		);
	}
}

interface VersionInfoState {
	version: string,
	yearspan: string
}

class VersionInfo extends Component<{}, VersionInfoState> {
	state: Readonly<VersionInfoState> = {
		version: "",
		yearspan: ""
	}

	render() {
		return (<div className="versionInfo">
			<Labelled label="Version:"
				contents={this.state.version + " (" + this.state.yearspan + ")"} />
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
