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
	if (this.getIn(['tags', 'envelopeShape']) === '{{}}') {
		return '{{\n' + this.exprs.map(function(it) {
			return it.toString();
		}).join('\n') + '\n}}';
	} else if (this.getIn(['tags', 'source']) === 'module') { 
		return this.exprs.map(function(node) {
			return node.toString();
		}).join('\n');
	} else {
		return '{\n' + this.exprs.map(function(it) {
			return it.toString();
		}).join('\n') + '\n}';
	}
};

Block.prototype.repr = function(depth, style) {
	let exps = this.exprs.map(function(it) {
		return it.repr(depth, style);
	});

	let open, close;

	if (this.getIn(['tags', 'source']) === 'module') {
		return exps.join('\n').replace(/\n/g, '\n    ');
	} else if (this.getIn(['tags', 'envelopeShape']) === '{{}}') {
		[open, close] = ['{{', '}}'];
	} else {
		[open, close] = ['{', '}'];
	}

	return (
		style.delimiter(open) + '\n    ' +
		exps.join('\n').replace(/\n/g, '\n    ') + '\n' +
		style.delimiter(close)
	);
};

Block.prototype.eval = function(ctx) {
	// Recursively search for prefix expressions with a '\' operator
    // and replace them with their evaluated value
	// TODO: Figure out the right evaluation semantics for `\`
	//       operators in nested blocks
	let scope = new Context({outer: ctx});
	let temp = this.set('ctx', scope);
	// TODO: This needs to be a depth-first traversal
	return temp.transform(function(node) {
		return node._name === 'Evaluate' ? node.eval(scope) : node;
	});
};

Block.prototype.transform = function(func) {
	return func(this.update('exprs', function(exprs) {
		return exprs.map(function(node) {
			if (node && 'transform' in node) {
				return node.transform(func);
			} else {
				return func(node);
			}
		});
	}));
};

module.exports = Block;
