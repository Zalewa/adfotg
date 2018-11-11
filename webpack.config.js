var webpack = require('webpack');
var path = require('path');


module.exports = {
	entry: [
		path.join(__dirname, 'site/index.tsx')
	],
	module: {
		rules: [
			{
				test: /\.html$/,
				loader: 'file-loader?name=[name].[ext]',
			},
			{
				test: /\.tsx?$/,
				loader: 'awesome-typescript-loader'
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
		path: __dirname + '/site/dist',
		filename: 'bundle.js'
	},
	devServer: {
		contentBase: __dirname + '/site/dist',
		historyApiFallback: true
	},
	node: {
		console: true,
		fs: 'empty',
		net: 'empty',
		tls: 'empty'
	}
}
