var webpack = require('webpack');
var path = require('path');


module.exports = {
	context: path.resolve(__dirname, 'site'),
	entry: [
		path.resolve(__dirname, 'site/index.tsx')
	],
	module: {
		rules: [
			{
				test: /(\.html|\.ttf|\.txt)$/,
				loader: 'file-loader?name=[path][name].[ext]',
			},
			{
				test: /\.tsx?$/,
				loaders: ['babel-loader', 'awesome-typescript-loader']
			},
			{
				enforce: "pre",
				test: "/\.js$/",
				loader: "source-map-loader"
			},
			{
				test: /\.less$/,
				loaders: ["style-loader", "css-loader", "less-loader"]
			}
		]
	},
	devtool: "source-map",
	resolve: {
		extensions: [".ts", ".tsx", ".js", ".json"]
	},
	output: {
		path: path.resolve(__dirname, 'site/dist'),
		filename: 'bundle.js'
	},
	devServer: {
		contentBase: path.resolve(__dirname, 'site/dist'),
		historyApiFallback: true
	},
	node: {
		console: true,
		fs: 'empty',
		net: 'empty',
		tls: 'empty'
	}
}
