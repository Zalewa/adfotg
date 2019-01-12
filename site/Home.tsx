import * as React from 'react';
import { Component } from 'react';
import { boundMethod } from 'autobind-decorator';

import ImageLibrary from './ImageLibrary';
import Mount from './Mount';
import Search from './Search';
import Uploader from './Uploader';

interface HomeState {
	refreshSwitch: boolean
	search: string
	searchPrompt: string
}

export default class Home extends Component<{}, HomeState> {
	readonly state: HomeState = {
		refreshSwitch: false,
		search: "",
		searchPrompt: ""
	}

	searchPrompt: string

	render () {
		return (
			<div>
				<Search text={this.state.searchPrompt}
					onEdit={this.onSearchEdited}
					onSubmit={this.onSearchSubmitted} />
				<Mount refresh={this.state.refreshSwitch}
					search={this.state.search} />
				<ImageLibrary refresh={this.state.refreshSwitch}
					onCreatedImage={this.promptRefresh}
					onMountedImage={this.promptRefresh}
					search={this.state.search} />
			</div>);
	}

	@boundMethod
	private promptRefresh(): void {
		this.setState({
			refreshSwitch: !this.state.refreshSwitch
		})
	}

	@boundMethod
	private onSearchEdited(searchPrompt: string): void {
		this.searchPrompt = searchPrompt;
		this.setState({searchPrompt});
	}

	@boundMethod
	private onSearchSubmitted(): void {
		this.setState({search: this.searchPrompt});
	}

}
