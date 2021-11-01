import * as React from 'react';
import { Component } from 'react';
import { boundMethod } from 'autobind-decorator';

import style from '../style.less';

interface ModalProps {
	onClose: ()=>void
}

export default class Modal extends Component<ModalProps> {
	render() {
		return <div className={style.modal} onClick={this.handleOutsideClick}>
			<div className={style.modalDisplay} onClick={this.handleInsideClick}>
				<div className={style.modalTitlebar}>
					<button className={`${style.button} ${style.buttonModalClose}`} onClick={this.props.onClose}>X</button>
				</div>
				<div className={style.modalMiddle}>
					<div className={`${style.modalFrame} ${style.modalFrameLeft}`} />
					<div className={style.modalContents}>
						{this.props.children}
					</div>
					<div className={`${style.modalFrame} ${style.modalFrameRight}`} />
				</div>
				<div className={`${style.modalFrame} ${style.modalFrameBottom}`} />
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
		acceptClass: style.buttonSubmit,
	}

	render() {
		return (<Modal onClose={() => this.props.onCancel()}>
			<p className={style.modalText}>{this.props.text}</p>
			{this.props.children}
			<div className={style.modalButtons}>
				<button className={`${style.button} ${this.props.acceptClass}`}
					onClick={this.props.onAccept}>
					{this.props.acceptText}</button>
				<button className={style.button} onClick={this.props.onCancel}>{this.props.cancelText}</button>
			</div>
		</Modal>);
	}
}
