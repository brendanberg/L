const { Set } = require('immutable');
const pkg = require('../package.json');
const log = require('loglevel');


const L = {
	version: pkg.version,
	log: log,

	Skel: require('./skeleton'),
	AST: require('./ast'),

	Scanner: require('./scanner'),
	Parser: require('./parser'),

	Context: require('./context'),
	Bindings: require('./bindings'),
	Environment: require('./environment'),
};

module.exports = L;

