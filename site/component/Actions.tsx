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
	]} {...props} />;
};

interface ActionSetProps {
	className?: string
	even?: boolean
	right?: boolean
	baseline?: boolean
	children?: React.ReactNode
}

export const ActionSet = (props: ActionSetProps) => {
	return <div css={[
		{
			display: "flex",
			alignItems: props.baseline ? "baseline" : "stretch",
		},
		props.even && { justifyContent: "space-between" },
		props.right && { marginLeft: "auto" },
	]} {...props} />;
}
