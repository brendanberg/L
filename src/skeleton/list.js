
const { Map, List, Record } = require('immutable');
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
	return new AST.List({
		items: this.epxrs.map(function(item) {
			return match.match(context, item.emit())
		}),
		tags: this.tags
	});
};

module.exports = _List;

