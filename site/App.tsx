import * as React from 'react';
import { Component } from 'react';
import Dropzone from 'react-dropzone';
import { boundMethod } from 'autobind-decorator';
import * as request from 'superagent';

import ImageLibrary from './ImageLibrary';
import Mount from './Mount';
import Notifier from './Notifier';
import Title from './Title';
import Uploader from './Uploader';

interface AppState {
	refreshSwitch: boolean,
}

export default class App extends Component<{}, AppState> {
	readonly state: AppState = {
		refreshSwitch: false,
	}

	render () {
		return (
			<ErrorBoundary>
				<Title refresh={this.state.refreshSwitch} />
				<Notifier />
				<Uploader onUpload={this.promptRefresh} />
				<Mount refresh={this.state.refreshSwitch} />
				<ImageLibrary refresh={this.state.refreshSwitch}
					onCreatedImage={this.promptRefresh} />
			</ErrorBoundary>);
	}

	@boundMethod
	private promptRefresh(): void {
		this.setState({
			refreshSwitch: !this.state.refreshSwitch
		})
	}
}

interface ErrorBoundaryState {
	error: Error | null,
}

class ErrorBoundary extends React.Component<{}, ErrorBoundaryState> {
	state: Readonly<ErrorBoundaryState> = {
		error: null
	}

	static getDerivedStateFromError(error: Error) {
		// Update state so the next render will show the fallback UI.
		return { error: error };
	}

	componentDidCatch(error: Error | null, info: object) {
		console.log('GURU MEDITATION', error, info);
	}

	render() {
		if (this.state.error != null) {
			return (<div className="guruMeditation">
				<h1>GURU MEDITATION</h1>
				<p>{this.state.error.toString()}</p>
			</div>);
		}

		return this.props.children;
	}
}
