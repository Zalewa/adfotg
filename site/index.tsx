import "@babel/polyfill";

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import App from './App';

// Amiga Topaz.ttf.
// The license requires to import all files.
require('./amiga-topaz/Amiga Topaz.ttf');
require('./amiga-topaz/license.html');
require('./amiga-topaz/readme.txt');
require('./amiga-topaz/smartfonts.com.txt');
require('./res/favicon_16.png');
require('./res/favicon_64.png');
require('./index.html');
require('./reset.css');
require('./style.less');

ReactDOM.render(
	<App />,
	document.getElementById('app'))
