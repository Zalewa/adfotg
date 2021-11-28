import { Response, HTTPError } from 'superagent';
import * as res from '../res';

export const Loader = (props: {className?: string}) =>
	<img src={res.loader} className={props.className} />;


export function errorToString(err: Error | string): string {
	if (typeof(err) === "string")
		return err;

	let res: Response = (err as any).response;
	let message: string;
	if (res && res.body && res.body.error) {
		message = res.body.error;
	} else {
		message = err.toString();
	}
	if (res && res.error) {
		const text = (res.error as HTTPError).text;
		if (text) {
			message = text + " -- " + message;
		}
	}
	return message;
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
