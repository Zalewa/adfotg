import * as React from 'react';
import { Component } from 'react';

import { Notification, Note } from './Notifier';
import style from '../style.less';


export default class Form extends Component {
	render() {
		return (<table className={style.form}>{this.props.children}</table>);
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
		return (<tbody className={style.formItem}>
			<tr className={style.formRow}>
				<td className={`${style.formCell} ${style.formCellLabel}`}>{label + ":"}</td>
				<td className={`${style.formCell} ${style.formCellWidget}`}>
					{children}
				</td>
				<td className={`${style.formCell} ${style.formCellHint}`}>{hint ? hint : ""}</td>
			</tr>
			{note && this.renderNote() || null}
		</tbody>);
	}

	private renderNote(): JSX.Element {
		return (<tr>
			<td colSpan={3} className={style.formItemNote}>
				<Notification note={this.props.note} />
			</td>
		</tr>);
	}
}
