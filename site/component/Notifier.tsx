import { useEffect, useState } from 'react';
import { css } from '@emotion/react';
import { rgba } from 'polished';

import { Button } from '../ui/Button';
import { errorToString } from '../ui/ui';

import { BulkResult } from '../app/Storage';

import * as skin from '../skin';

export enum NoteType {
	Error = "error",
	Success = "success"
}

export interface Note {
	type: NoteType,
	message: string,
	key?: number
}

type ApiResult = [number, string, string];

let __nextNoteId: number = 1;

/**
 * Meant to handle superagent.request errors.
 */
export function dispatchRequestError(err: Error) {
	if (err) {
		dispatch({
			type: NoteType.Error,
			message: errorToString(err)
		});
	}
}

export function dispatchApiErrors(title: string, apiResults: ApiResult[]) {
	apiResults.forEach((res: ApiResult) => {
		const [ code, label, message ] = res;
		if (code != 200) {
			dispatch({
				type: NoteType.Error,
				message: title + " -- " + label + " -- " + message
			});
		}
	});
}

export function dispatchBulkResultErrors(title: string, bulkResult: BulkResult) {
	bulkResult.statuses.forEach(res => {
		const { error_code, name, error } = res;
		if (error_code != 200) {
			dispatch({
				type: NoteType.Error,
				message: title + " -- " + name + " -- " + (error || "unknown error")
			});
		}
	});
}

export function dispatchError(e: Error | string) {
	dispatch({
		type: NoteType.Error,
		message: (typeof e === "string") ? e : e.toString()
	});
}

function dispatch(note: Note) {
	note.key = __nextNoteId++;
	window.dispatchEvent(new CustomEvent<Note>("__notify", {detail: note}));
}

const Notifier = () => {
	const [notes, setNotes] = useState<Note[]>([])

	useEffect(() => {
		const onNotify = (e: CustomEvent<Note>) => {
			setNotes([...notes, e.detail]);
		}
		window.addEventListener("__notify", onNotify);
		return () => {
			window.removeEventListener("__notify", onNotify);
		};
	}, [notes]);

	function onClose(key: number) {
		setNotes(notes.filter((note: Note) => note.key != key));
	}

	return (<div>
		{notes.map(note => <Notification key={note.key} note={note}
			onClose={onClose} />
		)}
	</div>);
}

interface NotificationProps {
	onClose?: (key: number) => void
	note: Note
	className?: string
}

const NotificationError = css({
	borderColor: skin.dangerColor,
	background: rgba(skin.dangerColor, 0.2),
});

const NotificationSuccess = css({
	borderColor: skin.successColor,
	background: rgba(skin.successColor, 0.4),
});

export const Notification = (props: NotificationProps) => {
	function noteClass(note: Note) {
		switch (note.type) {
		case NoteType.Error:
			return NotificationError;
		case NoteType.Success:
			return NotificationSuccess;
		default:
			return null;
		}
	}

	return (<div css={[
		{
			border: "1px dashed",
			padding: "0.25em",
			margin: "0.25em",
		},
		noteClass(props.note),
	]} className={props.className}>
		{props.onClose &&
		 <span css={{marginRight: "5px"}}>
			<Button onClick={() => props.onClose(props.note.key)} title="X" />
		 </span>}
		<span>{props.note.message}</span>
	</div>);
}

export default Notifier;
