const { Set } = require('immutable');
const { ParseError } = require('./error');
const rules = require('./rules');


Parser = function (scope) {
	this.scope = scope || Set([]);
};

Parser.prototype.parse = function (skeleton) {
	let ast, match = skeleton.transform(rules.block.bind(rules), [], this.scope);
	if (!match) {
		throw ParseError("that's a parse error");
	}

	[ast, this.scope] = match;
	return ast;

};

module.exports = Parser;

