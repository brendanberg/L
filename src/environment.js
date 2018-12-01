const { Set } = require('immutable');
const Bindings = require('./bindings');
const Scanner = require('./scanner');
const Parser = require('./parser');
const resolve = require('./resolve');
const { ParseError } = require('./error');


const pipeline = (...steps) => (input) => steps.reduce((data, step) => step(data), input);

const Environment = function () {
	this.bindings = new Bindings();

	this.scanner = Scanner;
	this.parser = new Parser();

	this.pipeline = [
		// 1. Scan source into skeleton tree
		this.scanner.parse,

		// 2. Convert skeleton tree into abstract syntax tree
		(val) => this.parser.parse(val),

		// 3. Resolve identifiers based on scope annotations from the previous
		//    step. This should be done slightly differently.
		//(val) => this.context.resolve(val),
		(ast) => {
			let transformed = resolve(ast, this.bindings);
			if (!transformed) {
				throw new ParseError("binding error, really");
			}

			[ast, this.bindings] = transformed;
			return ast;
		}
	];
};

Environment.prototype.parse = function (source) {
	return pipeline.apply(null, this.pipeline)(source);
};

/*Environment.prototype.createSymbol = function(label, type) {
	let node = new AST.Symbol({
		label: label,
	});

	if (type) {
		node = node.setIn(['tags', 'type'], type);
	}

	return node;
};*/

module.exports = Environment;

