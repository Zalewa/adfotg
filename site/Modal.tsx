import * as React from 'react';
import { Component } from 'react';
import { boundMethod } from 'autobind-decorator';

interface ModalProps {
	onClose: ()=>void
}

export default class Modal extends Component<ModalProps> {
	render() {
		return <div className="modal" onClick={this.handleOutsideClick}>
			<div className="modal__display" onClick={this.handleInsideClick}>
				<div className="modal__titlebar">
					<button className="button button--modal-close" onClick={this.props.onClose}>X</button>
				</div>
				<div className="modal__middle">
					<div className="modal__frame modal__frame--left" />
					<div className="modal__contents">
						{this.props.children}
					</div>
					<div className="modal__frame modal__frame--right" />
				</div>
				<div className="modal__frame modal__frame--bottom" />
			</div>
		</div>;
	}

	componentDidMount() {
		window.addEventListener("keydown", this.handleKeys);
	}

	componentWillUnmount() {
		window.removeEventListener("keydown", this.handleKeys);
	}

	@boundMethod
	private handleKeys(e: KeyboardEvent) {
		if (e.keyCode == 27) {
			this.props.onClose();
			e.stopPropagation();
		}
	}

	@boundMethod
	private handleOutsideClick(e: React.MouseEvent) {
		this.props.onClose();
		e.stopPropagation();
	}

	@boundMethod
	private handleInsideClick(e: React.MouseEvent) {
		e.stopPropagation();
	}
}


interface ConfirmModalProps {
	text: string
	onAccept?: ()=>void
	onCancel?: ()=>void
	acceptText?: string
	cancelText?: string
	acceptClass?: string
}

export class ConfirmModal extends Component<ConfirmModalProps> {
	private static readonly defaultProps: Partial<ConfirmModalProps> = {
		onAccept: ()=>{},
		onCancel: ()=>{},
		acceptText: "OK",
		cancelText: "Cancel",
		acceptClass: "button--submit"
	}

	render() {
		return (<Modal onClose={() => this.props.onCancel()}>
			<p className="modal__text">{this.props.text}</p>
			{this.props.children}
			<div className="modal__buttons">
				<button className={"button " + this.props.acceptClass}
					onClick={this.props.onAccept}>
					{this.props.acceptText}</button>
				<button className="button" onClick={this.props.onCancel}>{this.props.cancelText}</button>
			</div>
		</Modal>);
	}
}
