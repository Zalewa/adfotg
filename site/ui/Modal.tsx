import * as React from 'react';
import { useEffect } from 'react';
import styled from '@emotion/styled';

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
	children?: React.ReactNode
}

const Modal = (props: ModalProps) => {
	function handleKeys(e: KeyboardEvent) {
		if (e.key == "Escape") {
			props.onClose();
			e.stopPropagation();
		}
	}

	function handleOutsideClick(e: React.MouseEvent) {
		props.onClose();
		e.stopPropagation();
	}

	function handleInsideClick(e: React.MouseEvent) {
		e.stopPropagation();
	}

	useEffect(() => {
		window.addEventListener("keydown", handleKeys);
		return () => {
			window.removeEventListener("keydown", handleKeys);
		};
	}, [handleKeys]);

	return <Outside onClick={handleOutsideClick}>
		<Box onClick={handleInsideClick}>
			<TitleBar>
				<Button onClick={props.onClose} title="X" />
			</TitleBar>
			<Body>
				<VerticalFrame />
				<Pane>{props.children}</Pane>
				<VerticalFrame />
			</Body>
			<HorizontalFrame />
		</Box>
	</Outside>;
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
	children?: React.ReactNode
}

export const ConfirmModal = ({
	text,
	onAccept = () => {},
	onCancel = () => {},
	acceptText = "OK",
	cancelText = "Cancel",
	acceptPurpose = "submit",
	children
}: ConfirmModalProps) => (
	<Modal onClose={onCancel}>
		<ModalText>
			{text}
		</ModalText>
		{children}
		<ModalButtons>
			<Button purpose={acceptPurpose} onClick={onAccept} title={acceptText} />
			<Button onClick={onCancel} title={cancelText} />
		</ModalButtons>
	</Modal>
);

export default Modal;
