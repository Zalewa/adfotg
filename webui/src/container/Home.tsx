import { useState } from 'react';

import ImageLibrary from '@/container/ImageLibrary';
import Mount from '@/container/Mount';

interface HomeProps {
	search: string
}

const Home = ({search}: HomeProps) => {
	const [refreshToken, setRefreshToken] = useState(0)

	function promptRefresh(): void {
		setRefreshToken(token => token + 1)
	}

	return (
		<div>
			<Mount
				refresh={refreshToken}
				search={search}
			/>
			<ImageLibrary
				refreshToken={refreshToken}
				onCreatedImage={promptRefresh}
				onMountedImage={promptRefresh}
				search={search}
			/>
		</div>
	);
}

export default Home
