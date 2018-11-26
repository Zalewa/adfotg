import * as React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import App from './App';
import AdfWizard from './AdfWizard';

export const HOME_LINK = '/';
export const ADFWIZARD_LINK = '/adfwizard';

export default (
	<Router>
		<div>
			<Route exact path={HOME_LINK} component={App} />
			<Route path={ADFWIZARD_LINK} component={AdfWizard} />
		</div>
	</Router>
);
