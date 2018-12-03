import * as React from 'react';
import { Component } from 'react';

import { Notification, Note } from './Notifier';


export default class Form extends Component {
	render() {
		return (<table className="form">{this.props.children}</table>);
	}
}

interface FormItemProps {
	label: string
	hint?: string
	note?: Note
}

export class FormItem extends Component<FormItemProps> {
	render() {
		const { label, hint, children, note } = this.props;
		return (<tbody className="form__item">
			<tr className="form__row">
				<td className="form__cell form__cell--label">{label + ":"}</td>
				<td className="form__cell form__cell--widget">
					{children}
				</td>
				<td className="form__cell form__cell--hint">{hint ? hint : ""}</td>
			</tr>
			{note && this.renderNote()}
		</tbody>);
	}

	private renderNote(): JSX.Element {
		return (<tr>
			<td colSpan={3} className="form__item-note">
				<Notification note={this.props.note} />
			</td>
		</tr>);
	}
}
