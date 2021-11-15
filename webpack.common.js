var webpack = require('webpack');
var path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isRelease = process.env.NODE_ENV === 'production';

const cssBundler = isRelease ? MiniCssExtractPlugin.loader : "style-loader";
const cssLoaders = [
	cssBundler,
	"css-modules-typescript-loader",
	{
		loader: "css-loader",
		options: {
			importLoaders: 1,
			modules: {
				exportLocalsConvention: "camelCaseOnly",
				localIdentName: "[name]---[local]",
			},
		}
	},
];

module.exports = {
	context: path.resolve(__dirname, 'site'),
	entry: [
		path.resolve(__dirname, 'site/index.tsx')
	],
	plugins: [].concat(
		isRelease ? [
			new MiniCssExtractPlugin({
				filename: "[name].css",
			})
		] : []
	),
	module: {
		rules: [
			{
				test: /\.(gif|html|jpeg|jpg|png|svg|ttf|txt)$/,
				type: 'asset/resource',
			},
			{
				test: /\.tsx?$/,
				use: ["babel-loader", "ts-loader"]
			},
			{
				enforce: "pre",
				test: "/\.js$/",
				loader: "source-map-loader"
			},
			{
				test: /\.css$/,
				use: cssLoaders,
				exclude: [
					path.resolve(__dirname, "site/reset.css"),
				]
			},
			{
				test: path.resolve(__dirname, "site/reset.css"),
				use: [cssBundler, "css-loader"]
			}
		]
	},
	resolve: {
		extensions: [".ts", ".tsx", ".js", ".json"]
	},
	output: {
		path: path.resolve(__dirname, 'site/dist'),
		filename: 'bundle.js',
		assetModuleFilename: '[path][name][ext]',
	},
	devServer: {
		contentBase: path.resolve(__dirname, 'site/dist'),
		historyApiFallback: true
	}
};
