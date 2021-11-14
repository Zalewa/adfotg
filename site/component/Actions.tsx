interface ActionsProps {
	fullrow?: boolean;
	submit?: boolean;
	children?: React.ReactNode;
}

export const Actions = (props: ActionsProps) => {
	return <div css={[
		{
			display: "flex",
			alignItems: props.fullrow ? "stretch" : "baseline",
		},
		props.submit && { marginTop: "1em" },
	]}>{props.children}</div>;
};

interface ActionSetProps {
	className?: string
	even?: boolean
	right?: boolean
	baseline?: boolean
	children?: React.ReactNode
}

export const ActionSet = ({baseline, even, right, ...otherProps}: ActionSetProps) => {
	return <div css={[
		{
			display: "flex",
			alignItems: baseline ? "baseline" : "stretch",
		},
		even && { justifyContent: "space-between" },
		right && { marginLeft: "auto" },
	]} {...otherProps} />;
}
