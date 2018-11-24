import * as React from 'react';
import { Component } from 'react';
import * as request from 'superagent';

import { dispatchRequestError } from './Notifier';
import { Labelled, formatSize } from './ui';

interface TitleProps {
	refresh: boolean
}

export default class Title extends Component<TitleProps> {
	render() {
		return (
			<div className="title">
				<h1>ADF On-The-Go</h1>
				<a href="/help">API Help</a>
				<VersionInfo />
				<SpaceInfo refresh={this.props.refresh} />
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
		return (<div className="spaceInfo">
			<table>
				<thead>
					<tr>
						<th>Mount Point</th>
						<th>Available</th>
						<th>Total Space</th>
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
			el.push(<tr key={stat.name}>
				<th>{stat.name}</th>
				<td>{formatSize(stat.avail)}</td>
				<td>{formatSize(stat.total)}</td>
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
