import * as React from 'react';
import { Component } from 'react';
import Dropzone from 'react-dropzone';
import * as request from 'superagent';

import ImageLibrary from './ImageLibrary';
import Notifier from './Notifier';
import Title from './Title';
import Uploader from './Uploader';

export default class App extends Component {
	render () {
		return (
			<ErrorBoundary>
			<Title />
			<Notifier />
			<Uploader />
			<ImageLibrary />
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
			return (<div className="error">
				<h1>Something went wrong.</h1>
				<p>{this.state.error.toString()}</p>
			</div>);
		}

		return this.props.children;
	}
}
