import * as React from 'react';
import { Component } from 'react';

import style from '../style.less';

interface SectionProps {
	title: string,
	className: string
	subsection?: boolean
}

export default class Section extends Component<SectionProps> {
	render() {
		const className = !this.props.subsection ? style.section : style.subsection;
		return (<div className={className + " " + this.props.className}>
			<h1 className={!this.props.subsection ? style.sectionTitle : style.subsectionTitle}>{this.props.title}</h1>
			{this.props.children}
		</div>);
	}
}
