import * as React from 'react';
import * as ReactDOM from 'react-dom';

import App from './App';

require('./index.html');
require('./style.less');

ReactDOM.render(
	<App />,
	document.getElementById('app'))
