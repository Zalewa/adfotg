import * as React from 'react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { lighten } from 'polished';

import { errorToString } from './Notifier';
import * as res from '../res';
import * as skin from '../skin';

export type ButtonPurpose = "submit" | "delete";

const ButtonMixin = css(
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
		'&:active': [
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

export const CheckBox = (props: {
	checked?: boolean,
	name?: string,
	onClick?: (name?: string)=>void
}) => (
	<button css={[
		ButtonMixin,
		{
			width: "21px",
			height: "21px",
			lineHeight: "21px",
			padding: "0px",
		}
	]}
		name={props.name}
		onClick={() => props.onClick && props.onClick(props.name)}>
		<span css={[
			{
				content: '""',
				display: "none",
				position: "absolute",
			},
			props.checked && {
				display: "block",
				left: "6px",
				top: "1px",
				width: "4px",
				height: "11px",
				border: `solid ${skin.workbench.color}`,
				borderWidth: "0 2px 2px 0",
			transform: "rotate(45deg)",
			}
		]} />
	</button>
);

export const ErrorLabel = (props: {error: Error}) =>
	<div>{errorToString(props.error)}</div>;

interface IconProps {
	button?: boolean
	table?: boolean
	src: string
	alt?: string
	title?: string
}

export const Icon = (props: IconProps) => {
	const alt = props.alt || props.title;
	return <img css={props.table && props.button && {height: "14px"}}
		src={props.src} alt={alt}
		title={props.title} />
}

interface LabelledProps {
	label: string,
	contents: string|number,
	title?: string
}

export const Labelled = (props: LabelledProps) =>
	<div title={props.title}>
		<span css={{color: skin.labelColor, paddingRight: "5px"}}>
			{props.label}
		</span>
		<span>{props.contents}</span>
	</div>;

type LineInputProps = React.DetailedHTMLProps<
	React.InputHTMLAttributes<HTMLInputElement>,
	HTMLInputElement>;

export const LineInput = (props: LineInputProps) =>
	<div css={{width: "auto"}}>
		<input css={{
			borderRadius: 0,
			boxSizing: "border-box",
			minWidth: "10px",
			height: "100%",
			width: "100%",
		}} {...props} />
	</div>;

interface LinkProps {
	href: string,
	className?: string,
	children?: React.ReactNode,
}

export const LinkMixin = css({
	color: "cyan",
	cursor: "pointer",
	textDecoration: "none",
	"&:focus": {
		outline: "none",
	},
	"&:hover": {
		color: "gold !important",
	},
	"&:visited": {
		color: "cyan",
	}
})

export const Link = (props: LinkProps) =>
	<a css={LinkMixin} {...props} />

export interface LinkTextProps {
	className?: string,
	onClick?: React.MouseEventHandler,
	children?: React.ReactNode,
	key?: any
};

export const LinkText = (props: LinkTextProps) =>
	<span css={LinkMixin}
		className={props.className}
		onClick={(e) => {props.onClick(e); return false;}}>
		{props.children}
	</span>;

export const Loader = (props: {className?: string}) =>
	<img src={res.loader} className={props.className} />;

export const TextInput = styled.input({borderRadius: 0});


/**
 * Similar to ISO-8601 but without the T & Z artifacts.
 * YYYY-MM-DD HH:MM:SS
 * ex. 2011-10-05 14:48:00
 */
export function formatDate(date: Date): string {
	// Since the ISO format does what we want, we'll abuse it
	// and amptutate the unnecessary parts.
	let s = date.toISOString();
	s = s.substr(0, 19);
	s = s.replace("T", " ");
	return s;
}

const KILOBYTE = 1024;
const MEGABYTE = 1024 * KILOBYTE;
const GIGABYTE = 1024 * MEGABYTE;
export function formatSize(numBytes: number) {
	function div(divisor: number) {
		return fixdiv(numBytes, divisor, 2);
	}
	if (numBytes >= GIGABYTE) {
		return '' + div(GIGABYTE) + "GB";
	} else if (numBytes >= MEGABYTE) {
		return '' + div(MEGABYTE) + "MB";
	} else if (numBytes >= KILOBYTE) {
		return '' + div(KILOBYTE) + "kB";
	} else {
		return '' + numBytes + "B";
	}
}

function fixdiv(divident: number, divisor: number, precision: number): string {
	return (divident / divisor).toFixed(precision);
}
