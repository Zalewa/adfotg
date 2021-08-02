import * as React from 'react';
import { Component } from 'react';

interface SectionProps {
	title: string,
	className: string
	subsection?: boolean
}

export default class Section extends Component<SectionProps> {
	render() {
		let className = !this.props.subsection ? "section" : "subsection";
		return (<div className={className + " " + this.props.className}>
			<h1 className={className + "__title"}>{this.props.title}</h1>
			{this.props.children}
		</div>);
	}
}
