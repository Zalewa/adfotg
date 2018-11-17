import * as React from 'react';
import { Component } from 'react';
import * as request from 'superagent';

import { dispatchRequestError } from './Notifier';
import { Labelled } from './ui';

export default class Title extends Component {
	render() {
		return (
			<div className="title">
				<h1>ADF On-The-Go</h1>
				<VersionInfo />
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
			if (res.error) {
				dispatchRequestError(res.error);
			} else {
				this.setState(res.body);
			}
		})
	}
}
