import * as React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import AdfWizard from './AdfWizard';
import Home from './Home';

export const HOME_LINK = '/';
export const ADFWIZARD_LINK = '/adfwizard';

export default ((props: {}) =>
	<Router>
		<div>
			<Route exact path={HOME_LINK} component={Home} />
			<Route path={ADFWIZARD_LINK} component={AdfWizard} />
		</div>
	</Router>
);
