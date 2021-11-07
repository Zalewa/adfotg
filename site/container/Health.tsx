import { Component } from 'react';
import * as request from 'superagent';
import { boundMethod } from 'autobind-decorator';

import { enumKeys } from '../enum';
import { dispatchRequestError, dispatchError } from '../component/Notifier';
import * as skin from '../skin';


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
		const border = "2px solid gray";
		return (<table
			css={[
				{
					backgroundColor: skin.workbench.background,
					borderCollapse: "separate",
					borderLeft: border,
					borderRight: border,
					borderBottom: border,
					borderSpacing: "2px 0",
					padding: "1px",
					marginBottom: "1px",
					width: "100%",
				},
				this.hasErrors() && {cursor: "pointer"},
			]} onClick={this.showErrors}>
			<tbody>
				<tr css={{justifyItems: "stretch"}}>
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
		let modifier: string;
		let message: string = "";
		if (this.state.health.has(healthPoint)) {
			message = this.state.health.get(healthPoint);
			modifier = !message ? skin.successColor : skin.dangerColor;
		} else {
			modifier = skin.pane.background;
		}
		return (<td
			key={healthPoint}
			css={{
				minHeight: "4px",
				height: "4px",
				backgroundColor: modifier,
				"&:nth-child(last)": {
					marginRight: "2px",
				},
			}}
			id={"healthbar__" + healthPoint}
			title={message}
		/>);
	}

	private refresh(): void {
		request.get("/api/selfcheck").end((err, res) => {
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
