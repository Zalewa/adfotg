import * as React from 'react';
import { Component } from 'react';
import { boundMethod } from 'autobind-decorator';

import ImageLibrary from './ImageLibrary';
import Mount from './Mount';
import Uploader from './Uploader';

interface HomeState {
	refreshSwitch: boolean,
}

export default class Home extends Component<{}, HomeState> {
	readonly state: HomeState = {
		refreshSwitch: false,
	}

	render () {
		return (
			<div>
				<Mount refresh={this.state.refreshSwitch} />
				<ImageLibrary refresh={this.state.refreshSwitch}
					onCreatedImage={this.promptRefresh} />
			</div>);
	}

	@boundMethod
	private promptRefresh(): void {
		this.setState({
			refreshSwitch: !this.state.refreshSwitch
		})
	}
}
