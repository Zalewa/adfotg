import * as React from 'react';
import { Component } from 'react';

interface ModalProps {
	onClose: ()=>void
}

export default class Modal extends Component<ModalProps> {
	render() {
		return <div className="modal">
			<div className="modal__display">
				<button className="modal__close" onClick={this.props.onClose}>X</button>
				{this.props.children}
			</div>
		</div>;
	}
}


interface ConfirmModalProps {
	text: string,
	onAccept?: ()=>void,
	onCancel?: ()=>void,
	acceptText?: string,
	cancelText?: string
}

export class ConfirmModal extends Component<ConfirmModalProps> {
	private static readonly defaultProps: Partial<ConfirmModalProps> = {
		onAccept: ()=>{},
		onCancel: ()=>{},
		acceptText: "OK",
		cancelText: "Cancel"
	}

	render() {
		return (<Modal onClose={() => this.props.onCancel()}>
			<span className="modal__text">{this.props.text}</span>
			{this.props.children}
			<div className="modal__buttons">
				<button className="modal__button" onClick={this.props.onAccept}>{this.props.acceptText}</button>
				<button className="modal__button" onClick={this.props.onCancel}>{this.props.cancelText}</button>
			</div>
		</Modal>);
	}
}
