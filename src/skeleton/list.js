
const { Map, List, Record } = require('immutable');
const { NotImplemented } = require('../error');
const _ = null;
const _map = Map({});
const _list = List([]);

const AST = require('../ast');


_List = Record({exprs: _list, tags: _map}, 'List');

_List.prototype.toString = function() {
	return '[' + this.exprs.map(function(x) {
		return x.toString();
	}).toArray().join(', ') + ']';
};

_List.prototype.repr = function(depth, style) {
	return this.toString();
};

_List.prototype.transform = function(context, match) {
	throw new NotImplemented('Cannot call transform on a skeleton node other than block');
};

module.exports = _List;

