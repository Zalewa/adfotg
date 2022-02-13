import { Component } from 'react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { rgba } from 'polished';
import { boundMethod } from 'autobind-decorator';
import * as request from 'superagent';

import { HealthBar } from './Health';
import { dispatchRequestError } from '../component/Notifier';
import { HOME_LINK, UPLOAD_LINK } from '../routes';
import Search from '../component/Search';
import { Labelled } from '../ui/Label';
import { AppLink, AppLinkProps, Link } from '../ui/Link';
import { Table, TableRecord, HeaderCell, LabelCell, DataCell } from '../ui/Table';
import { formatSize } from '../ui/ui';
import * as responsive from '../responsive';
import * as skin from '../skin';

interface TitleProps {
	refresh: boolean
	canSearch: boolean
	search: string
	onSearch: (s: string)=>void
}

interface TitleState {
	title: string
	searchPrompt: string
}

const TitleRow = styled.div({display: "flex"});
const TitleSection = (props: {fill?: boolean, children?: React.ReactNode}) =>
	<div css={[{display: "block"}, props.fill && {flexGrow: 1}]} >{props.children}</div>;

const AppTitle = css({
	display: "block",
	fontStyle: "italic",
	fontSize: "2em",
	textShadow: `2px 2px ${rgba(0, 0, 0, 64)}`,
	margin: 0,
	marginBottom: "10px",
	padding: 0,
	width: "100%",
	[`@media (${responsive.tightScreen})`]: {
		fontSize: "3em",
	},
	[`@media (${responsive.normalScreen})`]: {
		fontSize: "4em",
	},
});

export default class Title extends Component<TitleProps, TitleState> {
	constructor(props: TitleProps) {
		super(props);
		this.state = {
			title: this.getMatchMediaTitle(),
			searchPrompt: props.search
		};
	}

	searchPrompt: string

	render() {
		return (
			<div css={{
				borderBottom: `1px solid ${skin.page.color}`,
				display: "block",
				marginBottom: "16px",
				minHeight: "105px",
				paddingBottom: "1px",
			}}>
				<TitleRow>
				<TitleSection fill>
					<TitleAppLink css={AppTitle} to={HOME_LINK}>{this.state.title}</TitleAppLink>
				</TitleSection>
				<TitleSection>
					<SpaceInfo refresh={this.props.refresh} />
					<HealthBar />
					<TitleRow>
						<Link href="/api/help">API Help</Link>
						<VersionInfo />
					</TitleRow>
				</TitleSection>
				</TitleRow>
				<TitleRow>
					<TitleSection fill>
						<TitleAppLink to={UPLOAD_LINK}>Upload</TitleAppLink>
					</TitleSection>
					{this.renderSearch()}
				</TitleRow>
			</div>
		);
	}

	private renderSearch(): JSX.Element {
		if (this.props.canSearch) {
			return (<TitleSection>
				<Search text={this.state.searchPrompt}
					onEdit={this.onSearchEdited}
					onSubmit={this.onSearchSubmitted} />
			</TitleSection>);
		} else {
			return null;
		}
	}

	componentDidMount() {
		responsive.matchWidth.addListener(this.matchMedia);
	}

	componentDidUpdate(props: TitleProps) {
		if (props.search !== this.props.search) {
			this.setState({searchPrompt: this.props.search});
		}
	}

	componentWillUnmount() {
		responsive.matchWidth.removeListener(this.matchMedia);
	}

	@boundMethod
	private matchMedia(): void {
		this.setState({title: this.getMatchMediaTitle()});
	}

	private getMatchMediaTitle(): string {
		return responsive.matchWidth.matches ? "ADF OTG" : "ADF On-The-Go";
	}

	@boundMethod
	private onSearchEdited(searchPrompt: string): void {
		this.setState({searchPrompt});
	}

	@boundMethod
	private onSearchSubmitted(): void {
		this.props.onSearch(this.state.searchPrompt);
	}
}

interface VersionInfoState {
	version: string,
	yearspan: string,
	lastyear: string
}

class VersionInfo extends Component<{}, VersionInfoState> {
	state: Readonly<VersionInfoState> = {
		version: "",
		yearspan: "",
		lastyear: ""
	}

	render() {
		return (<div css={{marginLeft: "auto", textAlign: "right"}}>
			<Labelled label="Version:" title={this.state.yearspan}
				contents={this.state.version + " (" + this.state.lastyear + ")"} />
		</div>);
	}

	componentDidMount() {
		request.get("/api/version").end((err, res) => {
			dispatchRequestError(err);
			if (!err) {
				this.setState(res.body);
			}
		})
	}
}

interface FsStats {
	name: string
	total: number
	avail: number
}

interface SpaceInfoState {
	fsStats: FsStats[]
}

class SpaceInfo extends Component<{refresh: boolean}, SpaceInfoState> {
	readonly state: SpaceInfoState = {
		fsStats: []
	}

	render() {
		return (<div>
			<Table css={{margin: "0px"}}>
				<thead>
					<tr>
						<HeaderCell>Mount Point</HeaderCell>
						<HeaderCell>Available</HeaderCell>
						<HeaderCell rightmost>Total Space</HeaderCell>
					</tr>
				</thead>
				<tbody>
					{this.renderStats()}
				</tbody>
			</Table>
			</div>);
	}

	componentDidUpdate(props: TitleProps) {
		if (this.props.refresh !== props.refresh) {
			this.refresh();
		}
	}

	componentDidMount() {
		this.refresh();
	}

	private renderStats(): JSX.Element[] {
		let el: JSX.Element[] = [];
		this.state.fsStats.forEach((stat: FsStats) => {
			el.push(<TableRecord key={stat.name}>
				<LabelCell>{stat.name}</LabelCell>
				<DataCell>{formatSize(stat.avail)}</DataCell>
				<DataCell>{formatSize(stat.total)}</DataCell>
			</TableRecord>)
		});
		return el;
	}

	private refresh(): void {
		request.get("/api/filesystem").end((err, res) => {
			dispatchRequestError(err);
			if (!err) {
				this.setState({fsStats: res.body});
			}
		});
	}
}

const TitleAppLink = (props: AppLinkProps) =>
	<AppLink
		css={{
			fontSize: "1.5em",
		}} {...props} />;
