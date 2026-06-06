import { useParams } from 'react-router';

import { MountImage } from '../component/MountImage';
import { Section } from '../ui/Section';


export default () => {
	const params = useParams();
	const path = params["*"];
	return <Section title="Inspect Image">
		{path ? <MountImage showName={true} name={path} refreshCounter={1} /> : "No path"}
	</Section>;
}
