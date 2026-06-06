import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './reset.css'; // important to import this before App and style
import App from './container/App';

// Favicon
import './res/favicon_16.png';
import './res/favicon_64.png';

createRoot(document.getElementById('app')!).render(
	<StrictMode>
		<App />
	</StrictMode>
)
