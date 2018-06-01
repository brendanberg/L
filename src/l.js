const pkg = require('../package.json');
const log = require('loglevel');

module.exports = {
	version: pkg.version,
	Skel: require('./skeleton'),
	AST: require('./ast'),
	Parser: require('./parser'),
	Rules: require('./rules'),
	Context: require('./context'),
	log: log
};
