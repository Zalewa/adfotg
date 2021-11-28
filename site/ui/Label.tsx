import { ReactNode } from 'react';

import { errorToString } from './ui';
import * as skin from '../skin';

export const ErrorLabel = (props: {error: Error | string}) =>
	<div>
		<span css={{color: skin.dangerColor}}>Error: </span>
		{errorToString(props.error)}
	</div>;

interface LabelledProps {
	label: string,
	contents: ReactNode
	title?: string
}

export const Labelled = (props: LabelledProps) =>
	<div title={props.title}>
		<span css={{color: skin.labelColor, paddingRight: "5px"}}>
			{props.label}
		</span>
		<span>{props.contents}</span>
	</div>;
