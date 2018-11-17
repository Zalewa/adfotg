import * as React from 'react';
import { Component } from 'react';

interface LabelledProps {
	label: string,
	contents: string|number
}

export const Labelled = (props: LabelledProps) => {
	return <div className="labelled">
			<span className="labelled__label">{props.label}</span>
			<span className="labelled__content">{props.contents}</span>
	</div>
};
