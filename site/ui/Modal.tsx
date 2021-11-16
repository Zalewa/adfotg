import * as React from 'react';
import { Component } from 'react';
import styled from '@emotion/styled';
import { boundMethod } from 'autobind-decorator';

import { Button, ButtonPurpose } from './Button';

import * as skin from '../skin';

const Outside = styled.div([skin.fullpage, {
	backgroundColor: "rgba(0,0,0,0.5);",
	zIndex: 2,
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
}]);

const Box = styled.div([
	{
		color: skin.workbench.color,
		backgroundColor: skin.workbench.background,
		minWidth: "300px",
	},
	skin.workbenchBorderLightDark,
]);

const Frame = styled.div({
	backgroundColor: skin.workbench.titleColor,
});

const frameBreadth = "2px";

const VerticalFrame = styled(Frame)({
	width: frameBreadth,
	height: "100%",
	display: "table-cell",
});

const HorizontalFrame = styled(Frame)({
	width: "100%",
	height: frameBreadth,
});

const TitleBar = styled.div({
	backgroundColor: skin.workbench.titleColor,
	minHeight: "28px",
});

const Body = styled.div({
	display: "table",
	width: "100%",
});

const Pane = styled.div([
	{
		display: "table-cell",
		padding: "5px",
	},
	skin.workbenchBorderDarkLight,
]);


interface ModalProps {
	onClose: ()=>void
}

export default class Modal extends Component<ModalProps> {
	render() {
		return <Outside onClick={this.handleOutsideClick}>
			<Box onClick={this.handleInsideClick}>
				<TitleBar>
					<Button onClick={this.props.onClose} title="X" />
				</TitleBar>
				<Body>
					<VerticalFrame />
					<Pane>{this.props.children}</Pane>
					<VerticalFrame />
				</Body>
				<HorizontalFrame />
			</Box>
		</Outside>;
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


const ModalText = styled.p({
	marginBottom: "16px",
});

const ModalButtons = styled.div({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-evenly",
	marginTop: "5px",
});


interface ConfirmModalProps {
	text: string
	onAccept?: ()=>void
	onCancel?: ()=>void
	acceptText?: string
	cancelText?: string
	acceptPurpose?: ButtonPurpose
}

export class ConfirmModal extends Component<ConfirmModalProps> {
	public static readonly defaultProps: Partial<ConfirmModalProps> = {
		onAccept: ()=>{},
		onCancel: ()=>{},
		acceptText: "OK",
		cancelText: "Cancel",
		acceptPurpose: "submit",
	}

	render() {
		return (<Modal onClose={() => this.props.onCancel()}>
			<ModalText>{this.props.text}</ModalText>
			{this.props.children}
			<ModalButtons>
				<Button purpose={this.props.acceptPurpose}
					onClick={this.props.onAccept}
					title={this.props.acceptText}
					/>
				<Button onClick={this.props.onCancel}
					title={this.props.cancelText}
					/>
			</ModalButtons>
		</Modal>);
	}
}
