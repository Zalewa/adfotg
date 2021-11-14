import { Component } from 'react';
import { css } from '@emotion/react';
import { rgba } from 'polished';
import { Response, HTTPError } from 'superagent';
import { boundMethod } from 'autobind-decorator';

import { Button } from './ui';

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

export function errorToString(err: Error): string {
	let res: Response = (err as any).response;
	let message: string;
	if (res && res.body && res.body.error) {
		message = res.body.error;
	} else {
		message = err.toString();
	}
	if (res && res.error) {
		return (res.error as HTTPError).text + " -- " + message;
	} else {
		return message;
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

interface NotifierState {
	notes: Note[]
}

export default class Notifier extends Component<{}, NotifierState> {
	readonly state: NotifierState = {
		notes: []
	}
	private boundNotify: (e: CustomEvent<Note>) => void;

	componentDidMount() {
		window.addEventListener("__notify", this.onNotify);
	}

	componentWillUnmount() {
		window.removeEventListener("__notify", this.onNotify);
	}

	render() {
		let notifications: JSX.Element[] = [];
		this.state.notes.forEach(note => {
			notifications.push(<Notification key={note.key} note={note}
				onClose={this.onClose} />)
		});
		return (<div>
			{notifications}
		</div>);
	}

	@boundMethod
	onClose(key: number) {
		let notes = this.state.notes;
		notes = notes.filter(note => note.key != key);
		this.setState({notes: notes});
	}

	@boundMethod
	onNotify(e: CustomEvent<Note>) {
		let notes = this.state.notes;
		notes.push(e.detail);
		this.setState({notes: notes});
	}
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

export class Notification extends Component<NotificationProps> {
	render() {
		const { note, className } = this.props;
		return (<div css={[
			{
				border: "1px dashed",
				padding: "0.25em",
				margin: "0.25em",
			},
			this.noteClass(note),
		]} className={className}>
			{this.props.onClose &&
			 <span css={{marginRight: "5px"}}>
				<Button onClick={() => this.props.onClose(note.key)} title="X" />
			 </span>}
			<span>{note.message}</span>
		</div>);
	}

	private noteClass(note: Note) {
		switch (note.type) {
		case NoteType.Error:
			return NotificationError;
		case NoteType.Success:
			return NotificationSuccess;
		default:
			return null;
		}
	}
}
