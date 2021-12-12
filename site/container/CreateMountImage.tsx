import { Component, ReactNode } from 'react';
import * as request from 'superagent';
import { boundMethod } from 'autobind-decorator';

import { Actions, ActionSet } from '../component/Actions';
import List from '../ui/List';
import { Button } from '../ui/Button';
import { LineInput } from '../ui/Input';
import { ErrorLabel } from '../ui/Label';
import * as resrc from '../res';
import { sorted } from '../strings';


export interface CreateMountImageProps {
	adfs: string[]
	onDone?: ()=>void
}

interface CreateMountImageState {
	error: Error
	imageName: string
	sortedAdfs: string[]
	refreshing: boolean
}

export default class CreateMountImage extends Component<CreateMountImageProps, CreateMountImageState> {
	constructor(props: CreateMountImageProps) {
		super(props);
		this.state = {
			sortedAdfs: sorted(props.adfs),
			error: null,
			imageName: "",
			refreshing: true
		}
	}

	render() {
		return (<div>
			{this.state.refreshing ?
				this.renderRefreshing() : this.renderWorkspace()}
			{this.renderErrorWidget()}
		</div>);
	}

	private renderWorkspace(): ReactNode {
		return (<div>
			<span>Create Mount Image with following ADFs:</span>
			<List listing={this.state.sortedAdfs}
				onOrderChange={(sortedAdfs) => this.setState({sortedAdfs})} />
			<Actions submit fullrow>
			<ActionSet>
				<LineInput autoFocus type="text"
					value={this.state.imageName}
					onChange={e => this.onNameChange(e.target.value)}
					onKeyPress={e => {
						if (e.key === "Enter") {
							this.create();
						}
					}} />
			</ActionSet>
			<ActionSet right>
				<Button purpose="submit" onClick={this.create}
					disabled={this.state.imageName.length == 0}
					title="Create" />
			</ActionSet>
			</Actions>
		</div>);
	}

	private renderRefreshing(): ReactNode {
		if (!this.state.error) {
			return (<div>
				<div>Obtaining some extra data ...</div>
				<div><img width="100%" src={resrc.loader} /></div>
			</div>);
		} else {
			return (<div>An error has occurred during refresh.</div>);
		}
	}

	private renderErrorWidget(): ReactNode {
		if (this.state.error) {
			return <ErrorLabel error={this.state.error} />;
		}
		return null;
	}

	componentDidMount() {
		request.get("/api/adf/std").end((err, res) => {
			if (err) {
				this.setState({error: err})
			} else {
				let stdAdfs = res.body;
				let sortedAdfs = this.state.sortedAdfs;
				this.setState({
					sortedAdfs: stdAdfs.concat(sortedAdfs),
					refreshing: false
				});
			}
		});
	}

	@boundMethod
	private create(): void {
		if (!this.state.imageName)
			return;
		request.put("/api/mountimg/" + this.state.imageName + "/pack_adfs")
			.send({adfs: this.state.sortedAdfs})
			.end((err, res) => {
				if (err) {
					this.setState({error: err});
				} else {
					if (this.props.onDone)
						this.props.onDone();
				}
			});
	}

	@boundMethod
	private onNameChange(value: string): void {
		this.setState({imageName: value});
	}
}
