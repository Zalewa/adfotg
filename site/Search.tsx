import * as React from 'react';
import { Component } from 'react';

interface SearchProps {
	text: string
	onEdit: (text: string)=>void
	onSubmit: ()=>void
}

export default class Search extends Component<SearchProps> {
	render() {
		return (<div className="search">
			<input type="text" value={this.props.text}
				onChange={e => this.props.onEdit(e.target.value)}
				onKeyPress={e => {
					if (e.key === "Enter")
						this.props.onSubmit();
				}}
			/>
			<button className="search__submit" onClick={this.props.onSubmit}>Search</button>
		</div>);
	}
}
