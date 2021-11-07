import * as React from 'react';
import { Component } from 'react';
import { BrowserRouter as Router, Route, RouteComponentProps, Switch,
	withRouter }
	from 'react-router-dom';

import AdfWizard from './AdfWizard';
import Home from './Home';
import Notifier from '../component/Notifier';
import { HOME_LINK, ADFWIZARD_LINK } from '../routes';
import style from '../style.less';
import Title from './Title';

export default class App extends Component {
	render() {
		return (
			<ErrorBoundary>
				<Router>
					<AppRoute />
				</Router>
			</ErrorBoundary>);
	}
}

type AppProps = RouteComponentProps<{}>;

interface AppState {
	refreshSwitch: boolean
	search: string
}

const AppRoute = withRouter(
class AppRoute extends Component<AppProps, AppState> {
	readonly state: AppState = {
		refreshSwitch: false,
		search: ""
	}

	private unlisten: ()=>void;

	render() {
		return <div>
			<Title refresh={this.state.refreshSwitch}
				canSearch={this.canSearch()}
				search={this.state.search}
				onSearch={(search) => this.setState({search})} />
			<Notifier />
			<Switch>
				<Route exact path={HOME_LINK} render={
					(props) => <Home {...props} search={this.state.search} />} />
				<Route path={ADFWIZARD_LINK} component={AdfWizard} />
			</Switch>
		</div>
	}

	componentDidMount() {
		this.unlisten = this.props.history.listen((location, action) => {
			this.setState({refreshSwitch: !this.state.refreshSwitch});
		})
	}

	componentDidUpdate(props: AppProps) {
		if (this.props.location.pathname !== props.location.pathname) {
			this.setState({search: ""});
		}
	}

	componentWillUnmount() {
		this.unlisten();
	}

	private canSearch(): boolean {
		return this.props.location.pathname === HOME_LINK;
	}
});

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
			return (<div className={style.guruMeditation}>
				<div className={style.guruMeditationFrame}><div className={style.guruMeditationInnerFrame}>
					<h1 className={style.guruMeditationSection}>GURU MEDITATION</h1>
					<p className={style.guruMeditationSection}>ADF OTG has failed.</p>
					<p className={`${style.guruMeditationSection} ${style.guruMeditationSectionError}`}>{this.state.error.toString()}</p>
					<p className={style.guruMeditationSection}>
						If you think this was caused by a bug, please
						write down steps to reproduce it and report it
						at<br/><a className={style.link} href="https://github.com/Zalewa/adfotg">https://github.com/Zalewa/adfotg</a>
					</p>
					<p className={style.guruMeditationSection}>Browser's console may contain more detailed information.</p>
				</div></div>
			</div>);
		}

		return this.props.children;
	}
}