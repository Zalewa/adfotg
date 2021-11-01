import * as React from 'react';

import { errorToString } from './Notifier';
import * as res from '../res';
import style from '../style.less';

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

export const LinkText = (props: any) => {
	return (<span className={style.link + " " + (props.className ? props.className : "")}
		onClick={() => {props.onClick(); return false;}}>{props.children}</span>)
}

export const Loader = (props: {classMod?: string}) => {
	return (<img src={res.loader}
		className={style.loader + " " + (props.classMod || "")} />);
}


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
