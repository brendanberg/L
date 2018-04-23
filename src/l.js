var pkg = require('../package.json');
var Log = require('log');

module.exports = {
	version: pkg.version,
	Skel: require('./skeleton'),
	AST: require('./ast'),
	Parser: require('./parser'),
	Rules: require('./rules'),
	Context: require('./context'),
	log: new Log('error')
};
