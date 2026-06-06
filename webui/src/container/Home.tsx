import { Component } from 'react';

import ImageLibrary from './ImageLibrary';
import Mount from './Mount';

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
					onCreatedImage={this.promptRefresh.bind(this)}
					onMountedImage={this.promptRefresh.bind(this)}
					search={this.props.search} />
			</div>);
	}

	private promptRefresh(): void {
		this.setState({
			refreshSwitch: !this.state.refreshSwitch
		})
	}
}
