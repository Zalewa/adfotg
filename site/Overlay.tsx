import * as React from 'react';
import { Component } from 'react';

interface OverlayProps {
	onClose: ()=>void
}

export default class Overlay extends React.Component<OverlayProps> {
	render() {
		return <div className="overlay">
			<div className="overlay__display">
				<button className="overlay__close" onClick={this.props.onClose}>X</button>
				{this.props.children}
			</div>
		</div>;
	}
}
