import * as React from 'react';
import { Component } from 'react';

import * as resrc from './res';
import style from './style.less';
import { Icon } from './ui';

interface SearchProps {
	text: string
	onEdit: (text: string)=>void
	onSubmit: ()=>void
}

export default class Search extends Component<SearchProps> {
	render() {
		return (<div className={style.searchBar}>
			<button className={`${style.button} ${style.buttonIcon} ${style.buttonSubmit}`}
					onClick={this.props.onSubmit}>
				<Icon button title="Search" src={resrc.looking_glass} />
			</button>
			<input className={`${style.textInput} ${style.searchBarInput}`} type="text"
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
