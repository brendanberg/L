/*
   Symbol AST node
 */

const { List, Map, Set, Record } = require('immutable');
const _ = null;
const _map = Map({});
const _list = List([]);


let Symbol = Record({label: _, binding: _, scope: _, tags: _map}, 'Symbol');

Symbol.prototype.toString = function() {
	return (this.getIn(['tags', 'nullary'])) ? this.label + '.' : '.' + this.label;
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

