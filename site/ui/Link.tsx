import * as React from 'react';
import { NavLink, NavLinkProps } from 'react-router-dom';
import { css } from '@emotion/react';

interface LinkProps {
	href: string,
	className?: string,
	children?: React.ReactNode,
}

export const LinkMixin = css({
	color: "cyan",
	cursor: "pointer",
	textDecoration: "none",
	"&:focus": {
		outline: "none",
	},
	"&:hover": {
		color: "gold !important",
	},
	"&:visited": {
		color: "cyan",
	}
})

export const Link = (props: LinkProps) =>
	<a css={LinkMixin} {...props} />

export interface LinkTextProps {
	className?: string,
	onClick?: React.MouseEventHandler,
	children?: React.ReactNode,
	key?: any
};

export const LinkText = (props: LinkTextProps) =>
	<span css={LinkMixin}
		className={props.className}
		onClick={(e) => {props.onClick(e); return false;}}>
		{props.children}
	</span>;


export interface AppLinkProps extends NavLinkProps {
	children?: React.ReactNode
	className?: string
}

export const AppLink = (props: AppLinkProps) =>
	<NavLink
		css={LinkMixin}
		className={props.className}
		style={({ isActive }) => isActive ? {textDecoration: "underline"} : undefined }
		to={props.to} children={props.children} />;
