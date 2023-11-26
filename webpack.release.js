const { merge } = require('webpack-merge');
const path = require('path');
const common = require('./webpack.common.js');

module.exports = merge(common, {
	mode: 'production',
	devtool: 'source-map',
	output: {
		path: path.resolve(__dirname, 'src/adfotg/site'),
	},
});
