function r(path: string) {
	return require('./res/' + path);
}

export const loader = r('ajax-loader.gif');
export const usb_icon_horz = r('usb_icon_horz.svg');
