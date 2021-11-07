import { Component } from 'react';

import * as responsive from '../responsive';
import * as resrc from '../res';
import { Button, TextInput } from './ui';

interface SearchProps {
	text: string
	onEdit: (text: string)=>void
	onSubmit: ()=>void
}

export default class Search extends Component<SearchProps> {
	render() {
		return (<div css={{display: "flex"}}>
			<Button title="Search" icon={resrc.looking_glass} onClick={this.props.onSubmit} />
			<TextInput
				css={{
					// TODO these criterias shouldn't be defined here, really
					maxWidth: "200px",
					[`@media (${responsive.tighterScreen})`]: {
						maxWidth: "150px"
					},
				}}
				type="text"
				value={this.props.text}
				onChange={e => this.props.onEdit(e.target.value)}
				onKeyPress={e => {
					if (e.key === "Enter")
						this.props.onSubmit();
				}}
			/>
		</div>);
	}
}
