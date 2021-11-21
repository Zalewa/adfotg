import * as React from 'react';
import { Component, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Global, css, keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { darken } from 'polished';

import AdfWizard from './AdfWizard';
import Home from './Home';
import InspectMountImage from './InspectMountImage';
import Notifier from '../component/Notifier';
import { Link } from '../ui/Link';
import { HOME_LINK, ADFWIZARD_LINK } from '../routes';
import Title from './Title';
import * as skin from '../skin';

export default class App extends Component {
	render() {
		return (
			<ErrorBoundary>
				<Global styles={css`
					@font-face {
						font-family: Amiga Topaz;
						src: url(/res/font/amiga-topaz/Amiga%20Topaz.ttf) format('truetype');
					}
				`} />
				<Global styles={css({
					".page": {
						backgroundColor: darken(0.05, skin.page.background),
						color: skin.page.color,
						fontFamily: `${skin.fontFamily},Roboto,Helvetice Neue,Helvetica,Arial,sans-serif`,
						fontSize: "1em",
						margin: "0px auto",
						maxWidth: "800px",
					},

					".page__main": {
						backgroundColor: skin.page.background,
						margin: "auto 0",
					},
				})} />
				<Router>
					<AppRoute />
				</Router>
			</ErrorBoundary>);
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

	return <div>
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
		</Routes>
	</div>
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
			const blink = keyframes({
				"50%": {
					borderColor: skin.guruMeditation.color,
				},
			});
			const OuterFrame = styled.div({
				maxWidth: "800px",
				margin: "0 auto",
			});
			const InnerFrame = styled.div({
				border: "8px solid transparent",
				padding: "16px 50px",
				margin: "30px",
				animationName: blink,
				animationDuration: "1.0s",
				animationTimingFunction: "step-end",
				animationIterationCount: "infinite",
				animationDirection: "alternate",
			});
			const GuruSection = styled.p({
				"&:not(:last-child)": {
					marginBottom: "16px",
				}
			});
			return (<div css={[skin.fullpage, {
				backgroundColor: skin.guruMeditation.background,
				color: skin.guruMeditation.color,
				overflow: "auto",
			}]}>
				<OuterFrame><InnerFrame>
					<GuruSection as="h1">GURU MEDITATION</GuruSection>
					<GuruSection>ADF OTG has failed.</GuruSection>
					<GuruSection css={{marginLeft: "32px"}}>{this.state.error.toString()}</GuruSection>
					<GuruSection>
						If you think this was caused by a bug, please
						write down steps to reproduce it and report it
						at<br/><Link href="https://github.com/Zalewa/adfotg">https://github.com/Zalewa/adfotg</Link>
					</GuruSection>
					<GuruSection>Browser's console may contain more detailed information.</GuruSection>
				</InnerFrame></OuterFrame>
			</div>);
		}

		return this.props.children;
	}
}
