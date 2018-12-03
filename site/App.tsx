import * as React from 'react';
import { Component } from 'react';

import Notifier from './Notifier';
import Routes from './routes';
import Title from './Title';

interface AppState {
	refreshSwitch: boolean
}

export default class App extends Component<{}, AppState> {
	readonly state: AppState = {
		refreshSwitch: false
	}

	render() {
		return (
			<ErrorBoundary>
				<Routes onRouteChanged={
					(route: string) => this.setState({
						refreshSwitch: !this.state.refreshSwitch
					})}
					>
					<Title refresh={this.state.refreshSwitch} />
					<Notifier />
				</Routes>
			</ErrorBoundary>);
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
			return (<div className="guru-meditation">
				<div className="guru-meditation__frame"><div className="guru-meditation__inner-frame">
					<h1 className="guru-meditation__section">GURU MEDITATION</h1>
					<p className="guru-meditation__section">ADF OTG has failed.</p>
					<p className="guru-meditation__section guru-meditation__section--error">{this.state.error.toString()}</p>
					<p className="guru-meditation__section">
						If you think this was caused by a bug, please
						write down steps to reproduce it and report it
						at<br/><a className="link" href="https://github.com/Zalewa/adfotg">https://github.com/Zalewa/adfotg</a>
					</p>
					<p className="guru-meditation__section">Browser's console may contain more detailed information.</p>
				</div></div>
			</div>);
		}

		return this.props.children;
	}
}
