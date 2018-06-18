/*
   Function AST node
 */

const { Map, List, Record } = require('immutable');
const Context = require('../context');
const _ = null;
const _map = Map({});
const _list = List([]);


let Function_ = Record({template: _, guard: _, block: _, locals: _map, scope: _, tags: _map}, 'Function');

Function_.prototype.toString = function() {
	let guard = this.guard ? ' ? ' + this.guard.toString() : '';

    return (
        '(' + this.template.items.map(function(node) {
			return node.toString();
		}).join(', ') + ')' + guard + ' -> ' + this.block.toString()
    );
};

Function_.prototype.repr = function(depth, style) {
	let guard = this.guard ? (style.delimiter(' ? ') 
								+ this.guard.repr(depth, style)
							) : '';

	return (
		style.delimiter('(') +
		this.template.items.map((node) => {
			return node.repr(depth, style);
		}).join(style.delimiter(', ')) + 
		style.delimiter(')') + guard + style.delimiter(' -> ') + 
		this.block.repr(depth, style)
    );
}

Function_.prototype.eval = function(ctx) {
    return this.transform((node) => {
        return node._name === 'Immediate' ? node.eval(ctx) : node;
    });
};

Function_.prototype.transform = function(func) {
    let transform = function(node) {
        return (node && 'transform' in node) ? node.transform(func) : func(node);
    };

    return func(this.update('template', transform)
		.update('guard', (guard) => { return guard && transform(guard); })
		.update('block', transform)
	);
};

module.exports = Function_;

