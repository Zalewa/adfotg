import * as React from 'react';
import { Component } from 'react';

interface ActionsProps {
	fullrow?: boolean
	submit?: boolean
	children?: JSX.Element | JSX.Element[]
}

export const Actions = (props: ActionsProps) => {
	const base: string = "actions";
	let klass = base;
	if (props.fullrow)
		klass += " " + base + "--fullrow";
	if (props.submit)
		klass += " " + base + "--submit";
	return (<div className={klass}>
		{props.children}
	</div>);
}

interface ActionSetProps {
	className?: string
	even?: boolean
	right?: boolean
	children: JSX.Element[] | JSX.Element
}

export const ActionSet = (props: ActionSetProps) => {
	const base: string = "actions__set"
	let klass = base;
	if (props.even)
		klass += " " + base + "--even"
	if (props.right)
		klass += " " + base + "--right";
	if (props.className)
		klass += " " + props.className;
	return (<div className={klass}>
		{props.children}
	</div>);
}
