import { ReactNode } from 'react';
import * as skin from '../skin';

interface SectionProps {
	title: string,
	children: ReactNode,
	className?: string,
}

export const Section = (props: SectionProps) => (
	<div css={{
		marginTop: "2px",
		marginBottom: "16px",
		position: "relative",
	}}>
		<h1 css={{
			fontSize: "2em",
			margin: "0",
			marginBottom: "0.25em",
			textShadow: skin.titleShadow,
		}}>{props.title}</h1>
		{props.children}
	</div>
);

export const Subsection = (props: SectionProps) => (
	<div css={skin.Pane}>
		<h1 css={{
			textShadow: skin.titleShadow,
			fontSize: "1.5em",
		}}>{props.title}</h1>
		{props.children}
	</div>
);
