/*
  Release is basically the same as the dev. build, but the
  destination directory is different.
 */
var path = require('path');
var config = require('./webpack.config');
config.output.path = path.resolve(__dirname, 'adfotg/site');
module.exports = config;
