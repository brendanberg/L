/*
   HybridFunction AST node
 */

let I = require('immutable');

const _ = null;
const _map = I.Map({});
const _list = I.List([]);


let HybridFunction = I.Record({predicates: _list, tags: _map}, 'HybridFunction');

HybridFunction.prototype.toString = function() {
	return (
		"{{\n    " +
		this.predicates.map(function(x) {
			return x.toString(); 
		}).join('\n').replace(/\n/g, '\n    ') +
		"\n}}"
	);
};

HybridFunction.prototype.repr = function(depth, style) {
	//TODO: smart newlines for compact reprs
	return (
		style.delimiter('{{') + '\n    ' +
		this.predicates.map(function(x) {
			return x.repr(depth, style);
		}).join(
			style.delimiter('\n')
		).replace(/\n/g, '\n    ') + '\n' +
		style.delimiter('}}')
	);
};

HybridFunction.prototype.eval = function(ctx) {
	// Evaluate any eager nodes (???)
	return this.transform(function(node) {
		if (node._name === 'Evaluate') {
			return node.eval(ctx);
		} else {
			return node;
		}
	});
};

HybridFunction.prototype.transform = function(func) {
	return func(this.update('predicates', function(predicates) {
		return predicates.map(function(node) {
			return (node && 'transform' in node) ? node.transform(func) : func(node);
		});
	}));
};

module.exports = HybridFunction;

