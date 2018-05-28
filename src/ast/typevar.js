/*
   TypeVar AST node
 */

let I = require('immutable');

const _ = null;
const _map = I.Map({});
const _list = I.List([]);


let TypeVar = I.Record({label: _, tags: _map}, 'TypeVar');

TypeVar.prototype.toString = function() {
	return '$' + this.label;
};

TypeVar.prototype.repr = function(depth, style) {
    return style.name(this.toString());
};

TypeVar.prototype.eval = function(ctx) {
    return this;
};

TypeVar.prototype.transform = function(func) {
    return func(this);
};

module.exports = TypeVar;

