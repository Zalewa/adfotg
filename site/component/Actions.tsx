import * as React from 'react';

import style from '../style.less';

interface ActionsProps {
	fullrow?: boolean
	submit?: boolean
	children?: JSX.Element | JSX.Element[]
}

export const Actions = (props: ActionsProps) => {
	let klass = style.actions;
	if (props.fullrow)
		klass += " " + style.actionsFullrow;
	if (props.submit)
		klass += " " + style.actionsSubmit;
	return (<div className={klass}>
		{props.children}
	</div>);
}

interface ActionSetProps {
	className?: string
	even?: boolean
	right?: boolean
	baseline?: boolean
	children: JSX.Element[] | JSX.Element
}

export const ActionSet = (props: ActionSetProps) => {
	let klass = style.actionsSet;
	if (props.baseline)
		klass += " " + style.actionsSetBaseline;
	if (props.even)
		klass += " " + style.actionsSetEven;
	if (props.right)
		klass += " " + style.actionsSetRight;
	if (props.className)
		klass += " " + props.className;
	return (<div className={klass}>
		{props.children}
	</div>);
}
