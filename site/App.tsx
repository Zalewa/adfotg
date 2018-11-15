import * as React from 'react';
import { Component } from 'react';
import Dropzone from 'react-dropzone';
import * as request from 'superagent';

import ImageLibrary from './ImageLibrary';
import Title from './Title';
import Uploader from './Uploader';

export default class App extends Component {
	render () {
		return (
			<div>
			<Title />
			<Uploader />
			<ImageLibrary />
			</div>);
	}
}
