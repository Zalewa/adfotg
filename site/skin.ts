import { css } from '@emotion/react';

export const dangerColor = "#f33";
export const successColor = "#3f3";
export const labelColor = "#fff";
export const pane = {
	background: "rgba(255, 255, 255, 0.1)",
	border: "1px dashed rgba(255, 255, 255, 0.2)",
};
export const fontFamily = "Amiga Topaz"

export const titleShadow = "2px 2px rgba(0, 0, 0, 64)";

export const guruMeditation = {
	background: "#000",
	colorCritical: "#f20",
	// TODO: scrape the proper color off https://wiki.amigaos.net/wiki/Intuition_Alerts
	colorWarning: "#ff0",
}

export const kickstart = {
	background: "#414",
	color: "#ea8",
};

export const workbench = {
	background: "#aaa",
	color: "#000",
	titleColor: "#68b",
	borderLight: "2px solid #fff",
	borderDark: "2px solid #000",
}

export const page = kickstart;

export const Pane = css({
	backgroundColor: pane.background,
	border: pane.border,
	margin: "1em",
	padding: "4px",
	position: "relative",
});

export const fullpage = css({
	position: "fixed", /* Sit on top of the page content */
	width: "100%", /* Full width (cover the whole page) */
	height: "100%", /* Full height (cover the whole page) */
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
});

export const workbenchBorderLightDark = css({
	borderLeft: workbench.borderLight,
	borderTop: workbench.borderLight,
	borderRight: workbench.borderDark,
	borderBottom: workbench.borderDark,
});

export const workbenchBorderDarkLight = css({
	borderLeft: workbench.borderDark,
	borderTop: workbench.borderDark,
	borderRight: workbench.borderLight,
	borderBottom: workbench.borderLight,
});
