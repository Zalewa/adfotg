import "core-js/stable";

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import App from './App';

// Amiga Topaz.ttf.
// The license requires to import all files.
import './amiga-topaz/Amiga Topaz.ttf';
import './amiga-topaz/license.html';
import './amiga-topaz/readme.txt';
import './amiga-topaz/smartfonts.com.txt';
import './res/favicon_16.png';
import './res/favicon_64.png';
import './index.html';
import './reset.css';
import './style.less';

ReactDOM.render(
	<App />,
	document.getElementById('app'))
