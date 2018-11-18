import * as React from 'react';
import { Component } from 'react';

interface LabelledProps {
	label: string,
	contents: string|number
}

export const Labelled = (props: LabelledProps) => {
	return <div className="labelled">
			<span className="labelled__label">{props.label}</span>
			<span className="labelled__content">{props.contents}</span>
	</div>
};

export const LinkText = (props: any) => {
	return <span className="linkText" onClick={props.onClick}>{props.children}</span>
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