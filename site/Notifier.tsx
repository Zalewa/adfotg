import * as React from 'react';
import { Component } from 'react';
import { Response } from 'superagent';
import { boundMethod } from 'autobind-decorator';

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
	if (res) {
		return res.error.message + " -- " + message;
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
		return (<div className="notifier">
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
	classMod?: string
	onClose?: (key: number) => void
	note: Note
}

export class Notification extends Component<NotificationProps> {
	render() {
		const { note, classMod } = this.props;
		const klass = "notification notification--" + note.type + " "
			+ (classMod ? ("notification--" + classMod) :  "");
		return (<div className={klass}>
			{this.props.onClose &&
			<button className="button button--notification-close"
				onClick={() => this.props.onClose(note.key)}>X</button>
			}
			<span>{note.message}</span>
		</div>);
	}
}
