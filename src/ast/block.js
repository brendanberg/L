/*
    Block AST node
*/

const { List, Map, Record } = require('immutable');
const Context = require('../context');
const _ = null;
const _list = List([]);
const _map = Map({});


let Block = Record({exprs: _list, ctx: _, tags: _map}, 'Block');

Block.prototype.toString = function() {
	let join = (this.exprs.count() > 1) ? '\n' : ' ';
	if (this.getIn(['tags', 'source']) === 'module') { 
		return this.exprs.map(function(node) {
			return node.toString();
		}).join('\n');
	} else {
		return '{' + join + this.exprs.map(function(it) {
			return it.toString();
		}).join('\n') + join + '}';
	}
};

Block.prototype.repr = function(depth, style) {
	let join = (this.exprs.count() > 1) ? '\n' : ' ';
	let indent = (this.exprs.count() > 1) ? '    ' : '';
	let exps = this.exprs.map(function(it) {
		return it.repr(depth, style);
	});

	if (this.getIn(['tags', 'source']) === 'module') {
		return exps.join('\n').replace(/\n/g, '\n    ');
	} else {
		return (
			style.delimiter('{') + join + indent +
			exps.join('\n').replace(/\n/g, '\n    ') + join +
			style.delimiter('}')
		);
	}
};

Block.prototype.eval = function(ctx) {
	// Recursively search for prefix expressions with a '\' operator
    // and replace them with their evaluated value
	// TODO: Figure out the right evaluation semantics for `\`
	//       operators in nested blocks
	let temp = this.set('ctx', new Context({outer: ctx}));
	// TODO: This needs to be a depth-first traversal?
	let xform = function(node) {
		return node._name === 'Immediate' ? node.eval(temp.ctx) : node;
	};
	return temp.transform(xform);
};

Block.prototype.transform = function(func) {
	return func(this.update('exprs', function(exprs) {
		return exprs.map(function(expr) {
			return (expr && 'transform' in expr) ? expr.transform(func) : func(expr);
		});
	}));
};

module.exports = Block;
