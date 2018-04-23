/*
   Match AST node
 */

let I = require('immutable');

const _ = null;
const _map = I.Map({});
const _list = I.List([]);


let Match = I.Record({predicates: _list, ctx:_, tags: _map}, 'Match');

Match.prototype.toString = function() {
	return (
		"{{\n    " +
		this.predicates.map(function(x) {
			return x.toString(); 
		}).join('\n').replace(/\n/g, '\n    ') +
		"\n}}"
	);
};

Match.prototype.repr = function(depth, style) {
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

Match.prototype.eval = function(ctx) {
	// Evaluate any eager nodes (???)
	return this.transform(function(node) {
		if (node._name === 'Evaluate') {
			return node.eval(ctx);
		} else {
			return node;
		}
	}).set('ctx', ctx);
};

Match.prototype.transform = function(func) {
	return func(this.update('predicates', function(predicates) {
		return predicates.map(function(node) {
			return (node && 'transform' in node) ? node.transform(func) : func(node);
		});
	}));
    return func(this);
};

module.exports = Match;

