import { Component, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { MountImage } from '../component/MountImage';
import { Section } from '../ui/Section';


export default () => {
	const params = useParams();
	const path = params["*"];
	return <Section title="Inspect Image">
		<MountImage showName={true} name={path} refreshCounter={1} />
	</Section>;
}
