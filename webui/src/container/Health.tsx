import { useEffect, useState } from 'react';
import * as request from 'superagent';

import { enumKeys } from '@/enum';
import { dispatchRequestError, dispatchError } from '@/component/Notifier';
import * as skin from '@/skin';


const HealthPoint = {
	Rpi: "rpi",
	MassStorage: "g_mass_storage",
	Xdftool: "xdftool",
	Mtools: "mtools",
	Storage: "storage"
} as const

type HealthPoint = typeof HealthPoint[keyof typeof HealthPoint]

export const HealthBar = () => {
	const [health, setHealth] = useState<Map<string, string>>(new Map);

	function hasErrors(): boolean {
		for (const msg of health.values()) {
			if (msg)
				return true;
		}
		return false;
	}

	function showErrors(): void {
		health.forEach((msg: string, name: string) => {
			if (msg) {
				dispatchError("Health check '" + name + "': " + msg);
			}
		});
	}

	function refresh(): void {
		request.get("/api/selfcheck").end((err, res) => {
			dispatchRequestError(err);
			if (!err) {
				const health = new Map<string, string>()
				Object.keys(res.body ?? {}).forEach((name: string) => {
					health.set(name, res.body[name]);
				});
				setHealth(health);
			}
		})
	}

	useEffect(refresh, [])

	const border = "2px solid gray";
	return (
		<table
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
				hasErrors() && {cursor: "pointer"},
			]}
			onClick={showErrors}
		>
			<tbody>
				<tr css={{justifyItems: "stretch"}}>
					{
						enumKeys(HealthPoint)
							.map(healthPoint => HealthPoint[healthPoint])
							.map(healthPoint =>
								<HealthLed
									key={healthPoint}
									healthPoint={healthPoint}
									healthStatusKnown={health.has(healthPoint)}
									healthStatus={health.get(healthPoint)}
								/>
							)
					}
				</tr>
			</tbody>
		</table>
	);
}

const HealthLed = ({healthPoint, healthStatusKnown, healthStatus} : {
	healthPoint: HealthPoint,
	healthStatusKnown: boolean,
	healthStatus?: string
}) => {
	function backgroundColor(): string {
		if (healthStatusKnown) {
			return !healthStatus ? skin.successColor : skin.dangerColor;
		} else {
			return skin.pane.background;
		}
	}
	return (
		<td
			css={{
				minHeight: "4px",
				height: "4px",
				backgroundColor: backgroundColor(),
				"&:nth-of-type(last)": {
					marginRight: "2px",
				},
			}}
			id={"healthbar__" + healthPoint}
			title={healthStatus}
		/>
	);
}
