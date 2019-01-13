import * as React from 'react';
import { Component } from 'react';
import * as res from './res';

interface SearchProps {
	text: string
	onEdit: (text: string)=>void
	onSubmit: ()=>void
}

export default class Search extends Component<SearchProps> {
	render() {
		return (<div className="search-bar">
			<button className="button button--icon button--submit"
					onClick={this.props.onSubmit}>
				<img alt="Search" title="Search" src={res.looking_glass} />
			</button>
			<input className="text-input search-bar__input" type="text"
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
