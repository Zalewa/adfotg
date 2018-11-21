import * as React from 'react';
import { Component } from 'react';
import Dropzone from 'react-dropzone';
import { boundMethod } from 'autobind-decorator';
import * as request from 'superagent';

import ImageLibrary from './ImageLibrary';
import Mount, { CreateMountImage, CreateMountImageProps } from './Mount';
import Notifier from './Notifier';
import Overlay from './Overlay';
import Title from './Title';
import Uploader from './Uploader';

enum View {
	Main,
	CreateMountImage,
}

interface AppState {
	refreshSwitch: boolean,
	view: View,
	viewProps?: CreateMountImageProps
}

export default class App extends Component<{}, AppState> {
	readonly state: AppState = {
		refreshSwitch: false,
		view: View.Main
	}

	render () {
		return (
			<ErrorBoundary>
				{this.getOverlayWidget()}
				<Title />
				<Notifier />
				<Uploader onUpload={this.promptRefresh} />
				<Mount refresh={this.state.refreshSwitch} />
				<ImageLibrary refresh={this.state.refreshSwitch} onCreateImage={this.onCreateImage} />
			</ErrorBoundary>);
	}

	private getOverlayWidget(): JSX.Element {
		const widget = this.getOverlayInnerWidget();
		return widget ? <Overlay onClose={() => this.setState({view: View.Main})}>{widget}</Overlay> : null;
	}

	private getOverlayInnerWidget(): JSX.Element {
		switch (this.state.view) {
			case View.CreateMountImage:
				return <CreateMountImage {...this.state.viewProps}
					onDone={this.returnToMain} />;
			default:
				return null;
		}
	}

	@boundMethod
	private onCreateImage(adfs: string[]): void {
		this.setState({
			view: View.CreateMountImage,
			viewProps: {
				adfs: adfs
			}
		})
	}

	@boundMethod
	private promptRefresh(): void {
		this.setState({
			refreshSwitch: !this.state.refreshSwitch
		})
	}

	@boundMethod
	private returnToMain(): void {
		this.setState({
			view: View.Main,
			viewProps: null
		});
		this.promptRefresh();
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
