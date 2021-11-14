import * as React from 'react';
import styled from '@emotion/styled';

import { Notification, Note } from './Notifier';

import * as skin from '../skin';


const Form = styled.table({
	borderCollapse: "separate",
	borderSpacing: "0.25em",
});

export default Form;

interface FormItemProps {
	label: string
	hint?: string
	note?: Note
	children?: React.ReactNode
}

const FormItemLabel = styled.td({
	color: skin.labelColor,
	paddingRight: "5px",
	textAlign: "right",
});

const FormItemValue = styled.td({
	paddingRight: "2px",
});

const FormItemHint = styled.td();

const FormItemNote = (props: {note: Note}) => (
	<tr>
		<td colSpan={3} css={{display: "table-cell"}}>
			<Notification note={props.note} />
		</td>
	</tr>
);

export const FormItem = (props: FormItemProps) => (
	<tbody>
		<tr>
			<FormItemLabel>{props.label}:</FormItemLabel>
			<FormItemValue>{props.children}</FormItemValue>
			<FormItemHint>{props.hint}</FormItemHint>
		</tr>
		{props.note && <FormItemNote note={props.note} /> || null}
	</tbody>
)
