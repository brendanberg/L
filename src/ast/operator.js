
const { Map, List, Record } = require('immutable');
const _ = null;
const _map = Map({});
const _list = List([]);


Operator = Record({label: _, scope: _, tags: _map}, 'Operator');

Operator.prototype.toString = function () {
	return this.label;
};

Operator.prototype.repr = function (depth, fmt) {
	return this.toString();
};

Operator.prototype.eval = function(ctx) {
	return this;
};

Operator.prototype.transform = function(func) {
	return func(this);
};

module.exports = Operator;

