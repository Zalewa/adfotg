import * as React from 'react';
import { Component } from 'react';
import * as request from 'superagent';
import { boundMethod } from 'autobind-decorator';

import { enumKeys } from './enum';
import { dispatchRequestError, dispatchError } from './Notifier';
import style from './style.less';


enum HealthPoint {
	Rpi = "rpi",
	MassStorage = "g_mass_storage",
	Xdftool = "xdftool",
	Mtools = "mtools",
	Storage = "storage"
}


interface HealthBarState {
	health: Map<string, string>;
}


export class HealthBar extends Component<{}, HealthBarState> {
	readonly state: HealthBarState = {
		health: new Map<string, string>()
	};

	render() {
		let className = style.healthbar;
		if (this.hasErrors())
			className += ` ${style.healthbarHasErrors}`;
		return (<table className={className} onClick={this.showErrors}>
			<tbody>
				<tr className={style.healthbarRow}>
					{this.renderPoints()}
				</tr>
			</tbody>
		</table>);
	}

	componentDidMount() {
		this.refresh();
	}

	private renderPoints(): JSX.Element[] {
		let elems: JSX.Element[] = [];
		for (const healthPoint of enumKeys(HealthPoint)) {
			elems.push(this.renderPoint(HealthPoint[healthPoint]));
		}
		return elems;
	}

	private renderPoint(healthPoint: string): JSX.Element {
		let modifier;
		let message: string = "";
		if (this.state.health.has(healthPoint)) {
			message = this.state.health.get(healthPoint);
			modifier = !message ? style.healthbarPointGood : style.healthbarPointBad;
		} else {
			modifier = style.healthbarPointUnknown;
		}
		const className = `${style.healthbarPoint} ${modifier}`;
		return (<td key={healthPoint} className={className}
			id={"healthbar__" + healthPoint}
			title={message} />);
	}

	private refresh(): void {
		request.get("/check").end((err, res) => {
			dispatchRequestError(err);
			if (!err) {
				let { health } = this.state;
				Object.keys(res.body).forEach((name: string) => {
					health.set(name, res.body[name]);
				});
				this.setState({health});
			}
		})
	}

	private hasErrors(): boolean {
		for (const msg of this.state.health.values()) {
			if (!!msg)
				return true;
		}
		return false;
	}

	@boundMethod
	private showErrors(): void {
		this.state.health.forEach((msg: string, name: string) => {
			if (!!msg) {
				dispatchError("Health check '" + name + "': " + msg);
			}
		});
	}
}
