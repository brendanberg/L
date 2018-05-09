/*
   Qualifier AST node
 */

const { List, Map, Record } = require('immutable');
const _ = null;
const _map = Map({});
const _list = List([]);


let Qualifier = Record({label: _, tags: _map}, 'Qualifier');

Qualifier.prototype.toString = function() {
	return '.' + this.label;
};

Qualifier.prototype.repr = function(depth, style) {
    return style.name(this.toString());
};

Qualifier.prototype.eval = function(ctx) {
    return this;
};

Qualifier.prototype.transform = function(func) {
    return func(this);
};

module.exports = Qualifier;

