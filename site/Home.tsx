import * as React from 'react';
import { Component } from 'react';
import { boundMethod } from 'autobind-decorator';

import ImageLibrary from './ImageLibrary';
import Mount from './Mount';
import Uploader from './Uploader';

interface HomeProps {
	search: string
}

interface HomeState {
	refreshSwitch: boolean
}

export default class Home extends Component<HomeProps, HomeState> {
	readonly state: HomeState = {
		refreshSwitch: false,
	}

	render () {
		return (
			<div>
				<Mount refresh={this.state.refreshSwitch}
					search={this.props.search} />
				<ImageLibrary refresh={this.state.refreshSwitch}
					onCreatedImage={this.promptRefresh}
					onMountedImage={this.promptRefresh}
					search={this.props.search} />
			</div>);
	}

	@boundMethod
	private promptRefresh(): void {
		this.setState({
			refreshSwitch: !this.state.refreshSwitch
		})
	}
}
