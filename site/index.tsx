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
require('./index.html');
require('./style.less');

ReactDOM.render(
	<App />,
	document.getElementById('app'))
