import * as React from 'react';
import { Component } from 'react';
import { BrowserRouter as Router, Route, RouteComponentProps, withRouter }
	from 'react-router-dom';

import AdfWizard from './AdfWizard';
import Home from './Home';

export const HOME_LINK = '/';
export const ADFWIZARD_LINK = '/adfwizard';

interface RouteProps {
	onRouteChanged: (route: string)=>void
}

const AppRoute = withRouter(
class AppRoute extends Component<RouteProps & RouteComponentProps<{}>> {
	private unlisten: ()=>void;

	render() {
		return <div>
			{this.props.children}
		</div>
	}

	componentDidMount() {
		this.unlisten = this.props.history.listen((location, action) => {
			this.props.onRouteChanged(location.pathname);
		})
	}

	componentWillUnmount() {
		this.unlisten();
	}
});

export default ((props: RouteProps) =>
	<Router>
		<AppRoute {...props}>
			<Route exact path={HOME_LINK} component={Home} />
			<Route path={ADFWIZARD_LINK} component={AdfWizard} />
		</AppRoute>
	</Router>
);
