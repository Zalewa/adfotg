import { ReactNode } from 'react';
import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';

export type Severity = "critical"|"warning";

export function severityColor(severity: Severity) {
	switch (severity) {
		case "critical":
		default:
			return "#f20";
		case "warning":
			return "#fa2";
	}
}

interface GuruFrameProps {
	severity: Severity;
	children?: ReactNode;
}

export const GuruFrame = (props: GuruFrameProps) => {
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
