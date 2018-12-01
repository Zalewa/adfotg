import * as React from 'react';
import { Component } from 'react';

interface SectionProps {
	title: string,
	className: string
}

export default class Section extends Component<SectionProps> {
	render() {
		return (<div className={"section section--" + this.props.className}>
			<h1 className="section__title">{this.props.title}</h1>
			{this.props.children}
		</div>);
	}
}
