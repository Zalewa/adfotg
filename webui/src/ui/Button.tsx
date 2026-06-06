import * as React from 'react';
import { css } from '@emotion/react';
import { lighten } from 'polished';

import { Icon } from './Icon';
import * as skin from '../skin';

export type ButtonPurpose = "submit" | "delete";

export const ButtonMixin = css(
	skin.workbenchBorderLightDark,
	{
		backgroundColor: skin.workbench.background,
		color: skin.workbench.color,
		height: "28px",
		padding: "4px 8px",
		textAlign: "center",
		textDecoration: "none",
		display: "inline-block",
		fontFamily: skin.fontFamily,
		position: "relative",
		'&:active:enabled': [
			{
				backgroundColor: skin.workbench.titleColor,
			},
			skin.workbenchBorderDarkLight,
		],
		'&:disabled': {
			backgroundColor: lighten(0.2, skin.workbench.background),
			color: lighten(0.5, skin.workbench.color),
		},
	}
);

export const Button = (props: {
	disabled?: boolean,
	icon?: string,
	title?: string,
	table?: boolean,
	purpose?: ButtonPurpose,
	onClick?: React.MouseEventHandler,
}) => {
	let title = props.title;
	if (title === undefined && props.purpose) {
		const p = props.purpose;
		title = p[0].toUpperCase() + p.slice(1);
	}
	return <button
		css={[
			ButtonMixin,
			{
				fontSize: (props.icon || !props.table) ? "1em" : "0.75em",
			},
			props.purpose == "delete" && { backgroundColor: skin.dangerColor },
			props.icon && {
				padding: "0px 8px",
				width: "52px",
			},
			(props.icon && props.table) && {
				boxSizing: "content-box",
				padding: "2px",
				width: "28px",
				height: "14px",
				lineHeight: "14px",
			},
		]}
		disabled={props.disabled}
		onClick={props.onClick}
	>
		{props.icon ? <Icon button table={props.table} title={title} src={props.icon} /> : title }
	</button>
};
