
const { Map, List, Record } = require('immutable');
const { NotImplemented } = require('../error');
const _ = null;
const _map = Map({});
const _list = List([]);

const AST = require('../ast');


Type = Record({exprs: _list, tags: _map}, 'Type');

Type.prototype.toString = function () {
	return '<<' + this.exprs.map(function(x) {
		return x.toString();
	}).toArray().join(', ') + '>>';
};

Type.prototype.repr = function (depth, fmt) {
	return this.toString();
};

Type.prototype.transform = function(context, match) {
	throw new NotImplemented('Cannot call transform on a skeleton node other than block');
};

module.exports = Type;

