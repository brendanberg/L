/*
   Function AST node
 */

const { Map, List, Record } = require('immutable');
const Context = require('../context');
const _ = null;
const _map = Map({});
const _list = List([]);


let _Function = Record({template: _, block: _, ctx: _, tags: _map}, 'Function');

_Function.prototype.toString = function() {
    let arrow = ({fat: ' => ', thin: ' -> '})[this.tags['type'] || 'thin'];

    return (
        '(' + this.template.match.items.map(function(node) {
			return node.toString();
		}).join(', ') + ')' +
        arrow + this.block.toString()
    );
};

_Function.prototype.repr = function(depth, style) {
	let arrow = ({fat: ' => ', thin: ' -> '})[this.tags['type'] || 'thin'];

	return (
		style.delimiter('(') +
		this.template.match.items.map(function(node) {
			return node.toString();
		}).join(style.delimiter(', ')) + 
		style.delimiter(')') + style.delimiter(arrow) + this.block.repr(depth, style)
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

