import * as React from 'react';
import { Component } from 'react';

export const Actions = (props: any) => {
	return (<div className="actions">
		{props.children}
	</div>);
}

interface ActionSetProps {
	className?: string,
	right?: boolean,
	children: JSX.Element[] | JSX.Element
}

export const ActionSet = (props: ActionSetProps) => {
	let klass: string = "actions__set";
	if (props.right) {
		klass += "--right";
	}
	if (props.className) {
		klass += " " + props.className;
	}
	return (<div className={klass}>
		{props.children}
	</div>);
}
