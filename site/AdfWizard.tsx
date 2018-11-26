import * as React from 'react';
import { Component } from 'react';
import { Link } from 'react-router-dom';

import { HOME_LINK } from './routes';

export default class AdfWizard extends Component {
	render() {
		return (<Link to={HOME_LINK}>Back to home page</Link>);
	}
}
