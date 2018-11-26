import * as React from 'react';
import * as ReactDOM from 'react-dom';

import routes from './routes';

require('./index.html');
require('./style.less');

ReactDOM.render(
	routes,
	document.getElementById('app'))
