var webpack = require('webpack');
var path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
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
	plugins: [
		new HtmlWebpackPlugin({
			template: 'index.html',
			publicPath: '/',
		}),
	].concat(
		isRelease ? [
			new MiniCssExtractPlugin({
				filename: "[name].css",
			})
		] : []
	),
	module: {
		rules: [
			{
				test: /\.(gif|html|jpeg|jpg|png|svg|ttf|txt)$/i,
				type: "asset/resource",
				exclude: [
					path.resolve(__dirname, "site/index.html"),
				],
			},
			{
				test: /\.tsx?$/,
				use: ["babel-loader", "ts-loader"],
				exclude: /node_modules/,
			},
			{
				enforce: "pre",
				test: "/\.js$/i",
				loader: "source-map-loader"
			},
			{
				test: /\.css$/i,
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
		filename: '[name].[contenthash].js',
		assetModuleFilename: '[path][name][ext]',
		clean: true,
	},
	optimization: {
		moduleIds: 'deterministic',
		runtimeChunk: 'single',
		splitChunks: {
			cacheGroups: {
				vendor: {
					test: /[\\/]node_modules[\\/]/,
					name: 'vendors',
					chunks: 'all',
				},
			},
		},
	},
};
