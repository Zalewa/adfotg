import "core-js/stable";

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import './reset.css'; // important to import this before App and style
import App from './container/App';

// Amiga Topaz.ttf.
// The license requires to import all files.
import './res/font/amiga-topaz/Amiga Topaz.ttf';
import './res/font/amiga-topaz/license.html';
import './res/font/amiga-topaz/readme.txt';
import './res/font/amiga-topaz/smartfonts.com.txt';
import './res/favicon_16.png';
import './res/favicon_64.png';

ReactDOM.render(
	<App />,
	document.getElementById('app'))
