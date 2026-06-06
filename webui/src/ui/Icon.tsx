interface IconProps {
	button?: boolean
	table?: boolean
	src: string
	alt?: string
	title?: string
}

export const Icon = (props: IconProps) => {
	const alt = props.alt || props.title;
	return <img css={props.table && props.button && {height: "14px"}}
		src={props.src} alt={alt}
		title={props.title} />
}
