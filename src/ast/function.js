/*
   Function AST node
 */

const { Map, List, Record } = require('immutable');
const Context = require('../context');
const _ = null;
const _map = Map({});
const _list = List([]);


let _Function = Record({template: _, guard: _, block: _, ctx: _, tags: _map}, 'Function');

_Function.prototype.toString = function() {
	let guard = this.guard ? ' & ' + this.guard.toString() : '';
    return (
        '(' + this.template.match.items.map(function(node) {
			return node.toString();
		}).join(', ') + ')' + guard + ' -> ' + this.block.toString()
    );
};

_Function.prototype.repr = function(depth, style) {
	let guard = this.guard ? style.delimiter(' & ') + this.guard.repr(depth, style) : '';

	return (
		style.delimiter('(') +
		this.template.match.items.map(function(node) {
			return node.repr(depth, style);
		}).join(style.delimiter(', ')) + 
		style.delimiter(')') + guard + style.delimiter(' -> ') + 
		this.block.repr(depth, style)
    );
}

_Function.prototype.eval = function(ctx) {
	let scope = new Context({local: _map, outer: ctx});
    let val = this.transform(function(node) {
        return node._name === 'Evaluate' ? node.eval(scope) : node;
    }).set('ctx', scope);
    return val;
};

_Function.prototype.transform = function(func) {
    let transform = function(node) {
        return (node && 'transform' in node) ? node.transform(func) : func(node);
    };

    return func(this.update('block', transform));
};

module.exports = _Function;

