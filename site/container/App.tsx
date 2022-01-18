import * as React from 'react';
import { Component, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Global, css } from '@emotion/react';
import { darken } from 'polished';

import AdfWizard from './AdfWizard';
import Home from './Home';
import { GuruMeditation } from './GuruMeditation';
import InspectMountImage from './InspectMountImage';
import Notifier from '../component/Notifier';
import PageNotFound from '../component/PageNotFound';
import { HOME_LINK, ADFWIZARD_LINK } from '../routes';
import Title from './Title';
import * as skin from '../skin';

export default class App extends Component {
	render() {
		return (<>
			<Global styles={css`
				@font-face {
				font-family: Amiga Topaz;
				src: url(/res/font/amiga-topaz/Amiga%20Topaz.ttf) format('truetype');
				}
			`} />
			<Global styles={css({
				"body": {
					fontFamily: `${skin.fontFamily},Roboto,Helvetica Neue,Helvetica,Arial,sans-serif`,
					fontSize: "1em",
					margin: "0px auto",
					maxWidth: "800px",
				}
			})} />
			<ErrorBoundary>
				<Global styles={css({
					"html, body": {
						minHeight: "100vh",
					},

					"body": {
						backgroundColor: darken(0.05, skin.page.background),
						color: skin.page.color,
					},

					".app": {
						backgroundColor: skin.page.background,
						minHeight: "100vh",
						position: "absolute",
					},
				})} />
				<Router>
					<AppRoute />
				</Router>
			</ErrorBoundary>
		</>);
	}
}

const AppRoute = () => {
	const [ refreshSwitch, setRefreshSwitch ] = useState(false);
	const [ search, setSearch ] = useState("");
	const location = useLocation();
	const [ prevLocation, setPrevLocation ] = useState(location);

	useEffect(() => {
		if (prevLocation.pathname != location.pathname) {
			setPrevLocation(location);
			setSearch("");
		}
		setRefreshSwitch(!refreshSwitch);
	}, [location]);

	function canSearch(): boolean {
		return location.pathname === HOME_LINK;
	}

	return <>
		<Title refresh={refreshSwitch}
			canSearch={canSearch()}
			search={search}
			onSearch={(search) => setSearch(search)} />
		<Notifier />
		<Routes>
			<Route index element={<Home search={search} />} />
			<Route path={ADFWIZARD_LINK} element={<AdfWizard />} />
			<Route path="inspect">
				<Route path="mountimg/*" element={<InspectMountImage />} />
			</Route>
			<Route path="*" element={<PageNotFound />} />
		</Routes>
	</>
}

interface ErrorBoundaryState {
	error: Error | null,
}

class ErrorBoundary extends React.Component<{}, ErrorBoundaryState> {
	state: Readonly<ErrorBoundaryState> = {
		error: null
	}

	static getDerivedStateFromError(error: Error) {
		// Update state so the next render will show the fallback UI.
		return { error: error };
	}

	componentDidCatch(error: Error | null, info: object) {
		console.log('GURU MEDITATION', error, info);
	}

	render() {
		if (this.state.error != null) {
			return (<GuruMeditation severity="critical" error={this.state.error} />);
		}

		return this.props.children;
	}
}
