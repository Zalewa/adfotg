import * as React from 'react';
import { Component } from 'react';

import Notifier from './Notifier';
import Routes from './routes';
import Title from './Title';

export default class App extends Component {
	render () {
		// TODO Title refresh={true} is a placeholder
		// and the refresh functionality is disabled.
		return (
			<ErrorBoundary>
				<Title refresh={true} />
				<Notifier />
				<Routes />
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
			return (<div className="guruMeditation">
				<h1>GURU MEDITATION</h1>
				<p>{this.state.error.toString()}</p>
			</div>);
		}

		return this.props.children;
	}
}
