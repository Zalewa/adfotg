import * as responsive from '../responsive';
import * as resrc from '../res';
import { Button } from '../ui/Button';
import { TextInput } from '../ui/Input';

interface SearchProps {
	text: string
	onEdit: (text: string)=>void
	onSubmit: ()=>void
}

const Search = (props: SearchProps) => (
	<div css={{display: "flex"}}>
		<Button title="Search" icon={resrc.looking_glass} onClick={props.onSubmit} />
		<TextInput
			css={{
				// TODO these criterias shouldn't be defined here, really
				maxWidth: "200px",
				[`@media (${responsive.tighterScreen})`]: {
					maxWidth: "150px"
				},
			}}
			type="text"
			value={props.text}
			onChange={e => props.onEdit(e.target.value)}
			onKeyPress={e => {
				if (e.key === "Enter")
					props.onSubmit();
			}}
		/>
	</div>
);

export default Search;
