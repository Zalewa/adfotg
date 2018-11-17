import * as React from 'react';
import { Component } from 'react';
import { ResponseError } from 'superagent';

enum NoteType {
	Error = "error"
}

interface Note {
	type: NoteType,
	message: string,
	key?: number
}

let __nextNoteId: number = 1;

/**
 * Meant to handle superagent.request errors.
 */
export function dispatchRequestError(e: ResponseError) {
	dispatch({
		type: NoteType.Error,
		message: e.message
	})
}

export function dispatchError(e: Error) {
	dispatch({
		type: NoteType.Error,
		message: e.toString()
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
	private boundNotify: (e: CustomEvent<Note>) => void;

	constructor(props: {}) {
		super(props);
		this.onClose = this.onClose.bind(this);
		this.onNotify = this.onNotify.bind(this);
		this.state = {
			notes: []
		}
	}

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

	onClose(key: number) {
		let notes = this.state.notes;
		notes = notes.filter(note => note.key != key);
		this.setState({notes: notes});
	}

	onNotify(e: CustomEvent<Note>) {
		let notes = this.state.notes;
		notes.push(e.detail);
		this.setState({notes: notes});
	}
}

interface NotificationProps {
	onClose: (key: number) => void,
	note: Note,
	key: number
}

class Notification extends Component<NotificationProps> {
	render() {
		const note = this.props.note;
		return (<div className="notifier__notification--{note.type}">
			<button onClick={() => this.props.onClose(note.key)}>X</button>
			<span>{note.message}</span>
		</div>);
	}
}
