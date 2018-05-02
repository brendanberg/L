
const { Map, List, Record } = require('immutable');
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
	return new AST.Bottom();
};

module.exports = Type;

