import * as React from 'react';
import styled from '@emotion/styled';
import { lighten } from 'polished';

import { errorToString } from './Notifier';
import * as res from '../res';
import style from '../style.less';
import * as skin from '../skin';

export type ButtonPurpose = "submit" | "delete";

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
			skin.workbenchBorderLightDark,
			{
				backgroundColor: skin.workbench.background,
				color: skin.workbench.color,
				height: "28px",
				padding: "4px 8px",
				textAlign: "center",
				textDecoration: "none",
				display: "inline-block",
				fontSize: (props.icon || !props.table) ? "1em" : "0.75em",
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
}) => {
	let klass: string = style.buttonCheckmark;
	if (props.checked)
		klass += ` ${style.buttonCheckmarkChecked}`;
	return <button className={`${style.button} ${style.buttonCheckbox}`}
			name={props.name}
			onClick={() => props.onClick && props.onClick(props.name)}>
		<span className={klass} />
	</button>
}

export const DeleteButton = (props: any) => {
	let klass: string = `${style.button} ${style.buttonDelete}`
	if (props.className) {
		klass += " " + props.className;
	}
	return <button {...props} className={klass}>Delete</button>
}

export const ErrorLabel = (props: {error: Error}) => {
	return <div className={style.errorLabel}>
		{errorToString(props.error)}
	</div>
}

interface IconProps {
	button?: boolean
	table?: boolean
	src: string
	alt?: string
	title?: string
}

export const Icon = (props: IconProps) => {
	let klass = style.icon;
	if (props.button) {
		if (props.table) {
			klass += ` ${style.iconTableButton}`;
		} else {
			klass += ` ${style.iconButton}`;
		}
	}
	const alt = props.alt || props.title;
	return <img className={klass} src={props.src} alt={alt}
		title={props.title} />
}

interface LabelledProps {
	label: string,
	contents: string|number,
	title?: string
}

export const Labelled = (props: LabelledProps) => {
	return <div className={style.labelled} title={props.title}>
			<span className={style.labelledLabel}>{props.label}</span>
			<span className={style.labelledContent}>{props.contents}</span>
	</div>
}

type LineInputProps = React.DetailedHTMLProps<
	React.InputHTMLAttributes<HTMLInputElement>,
	HTMLInputElement>;

export const LineInput = (props: LineInputProps) => {
	return (<div className={style.lineInput}>
		<input className={style.lineInputInput} {...props} />
	</div>);
}

export interface LinkTextProps {
	className?: string,
	onClick?: React.MouseEventHandler,
	children?: React.ReactNode,
	key?: any
};

export const LinkText = (props: LinkTextProps) => {
	return (<span className={style.link + " " + (props.className ? props.className : "")}
		onClick={(e) => {props.onClick(e); return false;}}>{props.children}</span>)
}

export const Loader = (props: {classMod?: string}) => {
	return (<img src={res.loader}
		className={style.loader + " " + (props.classMod || "")} />);
}

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
