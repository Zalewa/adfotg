import { css } from '@emotion/react';

export const dangerColor = "#f33";
export const successColor = "#3f3";
export const labelColor = "#fff";
export const pane = {
	background: "rgba(255, 255, 255, 0.1)",
	border: "1px dashed rgba(255, 255, 255, 0.2)",
};
export const fontFamily = "Amiga Topaz"

export const guruMeditation = {
	background: "#000",
	color: "#f20",
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
