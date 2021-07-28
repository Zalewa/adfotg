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
				test: /(\.gif|\.html|\.png|\.svg|\.ttf|\.txt)$/,
				use: [
					{
						loader: 'file-loader',
						options: {
							name: '[path][name].[ext]',
							esModule: false
						}
					}
				]
			},
			{
				test: /\.tsx?$/,
				loader: "ts-loader"
			},
			{
				enforce: "pre",
				test: "/\.js$/",
				loader: "source-map-loader"
			},
			{
				test: /(\.css|\.less)$/,
				use: ["style-loader", "css-loader", "less-loader"]
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
	}
}
