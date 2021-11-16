import * as React from 'react';
import styled from '@emotion/styled';

type LineInputProps = React.DetailedHTMLProps<
	React.InputHTMLAttributes<HTMLInputElement>,
	HTMLInputElement>;

export const LineInput = (props: LineInputProps) =>
	<div css={{width: "auto"}}>
		<input css={{
			borderRadius: 0,
			boxSizing: "border-box",
			minWidth: "10px",
			height: "100%",
			width: "100%",
		}} {...props} />
	</div>;

export const TextInput = styled.input({borderRadius: 0});
