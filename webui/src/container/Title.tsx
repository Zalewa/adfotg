import { useEffect, useState } from 'react'
import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { rgba } from 'polished'
import * as request from 'superagent'

import { HealthBar } from '@/container/Health'
import { dispatchRequestError } from '@/component/Notifier'
import { HOME_LINK, UPLOAD_LINK } from '@/routes'
import Search from '@/component/Search'
import { Labelled } from '@/ui/Label'
import { AppLink, type AppLinkProps, Link } from '@/ui/Link'
import { Table, TableRecord, HeaderCell, LabelCell, DataCell } from '@/ui/Table'
import { formatSize } from '@/text'
import * as responsive from '@/responsive'
import * as skin from '@/skin'

const TitleRow = styled.div({display: "flex"})
const TitleSection = (props: {fill?: boolean, children?: React.ReactNode}) =>
	<div css={[{display: "block"}, props.fill && {flexGrow: 1}]} >{props.children}</div>

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
})

interface TitleProps {
	refreshToken: number
	canSearch: boolean
	search: string
	onSearch: (s: string)=>void
}

const Title = (props: TitleProps) => {
	const [title, setTitle] = useState(getMatchMediaTitle())

	const [searchPrompt, setSearchPrompt] = useState(props.search)

	// Reset the search prompt if a different search prop arrives.
	const [previousSearch, setPreviousSearch] = useState(props.search)
	if (props.search !== previousSearch) {
		setPreviousSearch(props.search)
		setSearchPrompt(props.search)
	}

	function getMatchMediaTitle(): string {
		return responsive.matchWidth.matches ? "ADF OTG" : "ADF On-The-Go"
	}

	function onSearchEdited(searchPrompt: string): void {
		setSearchPrompt(searchPrompt)
	}

	function onSearchSubmitted(): void {
		props.onSearch(searchPrompt)
	}

	useEffect(() => {
		function matchMedia(): void {
			setTitle(getMatchMediaTitle())
		}

		responsive.matchWidth.addEventListener("change", matchMedia)
		return () => {
			responsive.matchWidth.removeEventListener("change", matchMedia)
		}
	}, [])

	return (
		<div
			css={{
				borderBottom: `1px solid ${skin.page.color}`,
				display: "block",
				marginBottom: "16px",
				minHeight: "105px",
				paddingBottom: "1px",
			}}
		>
			<TitleRow>
				<TitleSection fill>
					<TitleAppLink css={AppTitle} to={HOME_LINK}>{title}</TitleAppLink>
				</TitleSection>
				<TitleSection>
					<SpaceInfo refreshToken={props.refreshToken} />
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
				{props.canSearch && (
					<TitleSection>
						<Search
							text={searchPrompt}
							onEdit={onSearchEdited}
							onSubmit={onSearchSubmitted}
						/>
					</TitleSection>
				)}
			</TitleRow>
		</div>
	)
}

interface VersionInfo {
	version: string,
	yearspan: string,
	lastyear: string
}

const VersionInfo = () => {
	const [versionInfo, setVersionInfo] = useState<VersionInfo>({
		version: "",
		yearspan: "",
		lastyear: "",
	})

	function fetch() {
		request
			.get("/api/version")
			.end((err, res) => {
				dispatchRequestError(err)
				if (!err) {
					setVersionInfo(res.body)
				}
			})
	}

	useEffect(fetch, [])

	return (
		<div css={{marginLeft: "auto", textAlign: "right"}}>
			<Labelled
				label="Version:"
				title={versionInfo.yearspan}
				contents={versionInfo.version + " (" + versionInfo.lastyear + ")"}
			/>
		</div>
	)
}

interface FsStats {
	name: string
	total: number
	avail: number
}

const SpaceInfo = ({refreshToken}: {refreshToken: number}) => {
	const [fsStats, setFsStats] = useState<FsStats[]>([])

	function fetch(): void {
		request
			.get("/api/filesystem")
			.end((err, res) => {
				dispatchRequestError(err)
				if (!err) {
					setFsStats(res.body ?? [])
				}
			})
	}

	useEffect(fetch, [refreshToken])

	return (
		<div>
			<Table css={{margin: "0px"}}>
				<thead>
					<tr>
						<HeaderCell>Mount Point</HeaderCell>
						<HeaderCell>Available</HeaderCell>
						<HeaderCell rightmost>Total Space</HeaderCell>
					</tr>
				</thead>
				<tbody>
					{fsStats.map((stat: FsStats) => (
						<TableRecord key={stat.name}>
							<LabelCell>{stat.name}</LabelCell>
							<DataCell>{formatSize(stat.avail)}</DataCell>
							<DataCell>{formatSize(stat.total)}</DataCell>
						</TableRecord>
					))}
				</tbody>
			</Table>
		</div>
	)
}

const TitleAppLink = (props: AppLinkProps) =>
	<AppLink
		css={{
			fontSize: "1.5em",
		}}
		{...props}
	/>

export default Title
