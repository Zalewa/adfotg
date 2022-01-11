import { ReactNode } from 'react';
import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';

import * as skin from '../skin';

type Severity = "critical"|"warning";

function severityColor(severity: Severity) {
	switch (severity) {
		case "critical":
		default:
			return skin.guruMeditation.colorCritical;
		case "warning":
			return skin.guruMeditation.colorWarning;
	}
}

interface GuruMeditationProps {
	severity: Severity;
	children?: ReactNode;
}

export const GuruMeditation = (props: GuruMeditationProps ) => {
	const GuruCenter = styled.div({
		maxWidth: "800px",
		margin: "0 auto",
	});
	return (<div css={[skin.fullpage, {
		backgroundColor: skin.guruMeditation.background,
		color: severityColor(props.severity),
		overflow: "auto",
	}]}>
		<GuruCenter>
			<GuruFrame {...props} />
		</GuruCenter>
	</div>);
}

export const GuruFrame = (props: GuruMeditationProps) => {
	const color = severityColor(props.severity);
	const blink = keyframes({
		"50%": {
			borderColor: color,
		},
	});
	return <div css={{
		animationName: blink,
		animationDuration: "1.0s",
		animationTimingFunction: "step-end",
		animationIterationCount: "infinite",
		animationDirection: "alternate",
		border: "8px solid transparent",
		color: color,
		padding: "16px 50px",
		margin: "30px",
		overflow: "auto",
	}} children={props.children} />;

}

export const GuruSection = styled.p({
	"&:not(:last-child)": {
		marginBottom: "16px",
	}
});
