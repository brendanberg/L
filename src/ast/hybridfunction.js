/*
   HybridFunction AST node
 */

let I = require('immutable');

const _ = null;
const _map = I.Map({});
const _list = I.List([]);


let HybridFunction = I.Record({predicates: _list, scope: _, tags: _map}, 'HybridFunction');

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
	let hybrid = this.transform(function(node) {
		return node._name === 'Immediate' ? node.eval(ctx) : node;
	});

	// TODO: Figure out semantics for closures over hybrid functions. Do all
	// individual predicates share the same environment? Is that gross?
	return hybrid;
};

HybridFunction.prototype.transform = function(func) {
	return func(this.update('predicates', function(predicates) {
		return predicates.map(function(node) {
			return (node && 'transform' in node) ? node.transform(func) : func(node);
		});
	}));
};

module.exports = HybridFunction;

