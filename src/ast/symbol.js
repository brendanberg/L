/*
   Symbol AST node
 */

const { List, Map, Set, Record } = require('immutable');
const _ = null;
const _map = Map({});
const _list = List([]);


let Symbol = Record({label: _, tags: _map}, 'Symbol');

Object.defineProperty(Symbol.prototype, 'scopes', {
	get() {
		if (this._scopes === undefined) {
			this._scopes = Set([]);
		}
		return this._scopes
	},
	set(scopes) { this._scopes = scopes; }
});

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

