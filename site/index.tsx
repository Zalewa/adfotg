import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './reset.css'; // important to import this before App and style
import App from './container/App';

// Amiga Topaz.ttf.
// The license requires to import all files.
import './res/font/amiga-topaz/Amiga Topaz.ttf';
import './res/font/amiga-topaz/readme.txt';
import './res/font/amiga-topaz/smartfonts.com.txt';
// The HTML file must be imported differently!
// TODO: fix this!!!
//import './res/font/amiga-topaz/license.html';

// Favicon
import './res/favicon_16.png';
import './res/favicon_64.png';

createRoot(document.getElementById('app')!).render(
	<StrictMode>
		<App />
	</StrictMode>
)
