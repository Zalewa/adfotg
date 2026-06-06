import { ButtonMixin } from './Button';
import * as skin from '../skin';

export const CheckBox = (props: {
	checked?: boolean,
	name?: string,
	onClick?: (name?: string)=>void
}) => (
	<button css={[
		ButtonMixin,
		{
			width: "21px",
			height: "21px",
			lineHeight: "21px",
			padding: "0px",
		}
	]}
		name={props.name}
		onClick={() => props.onClick && props.onClick(props.name)}>
		<span css={[
			{
				content: '""',
				display: "none",
				position: "absolute",
			},
			props.checked && {
				display: "block",
				left: "6px",
				top: "1px",
				width: "4px",
				height: "11px",
				border: `solid ${skin.workbench.color}`,
				borderWidth: "0 2px 2px 0",
			transform: "rotate(45deg)",
			}
		]} />
	</button>
);
