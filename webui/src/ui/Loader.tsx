import * as res from '@/res';

export const Loader = (props: {className?: string}) =>
	<img src={res.loader} className={props.className} />;
