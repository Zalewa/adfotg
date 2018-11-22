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
