/*
   Symbol AST node
 */

let I = require('immutable');

const _ = null;
const _map = I.Map({});
const _list = I.List([]);


let Symbol = I.Record({label: _, tags: _map}, 'Symbol');

Symbol.prototype.toString = function() {
	return '$' + this.label;
};

Symbol.prototype.repr = function(depth, style) {
    return style.name(this.toString());
};

Symbol.prototype.eval = function(ctx) {
    return this;
};

Symbol.prototype.transform = function(func) {
    return func(this);
};

module.exports = Symbol;

