
const { Map, List, Record } = require('immutable');
const _ = null;
const _map = Map({});
const _list = List([]);

const AST = require('../ast');


Operator = Record({label: _, tags: _map}, 'Operator');

Operator.prototype.toString = function () {
	return this.label;
};

Operator.prototype.repr = function (depth, fmt) {
	return this.toString();
};

Operator.prototype.eval = function(ctx) {
	return this;
};

Operator.prototype.transform = function(context, match) {
	// Note: This rule should be unreachable if the grammar rules are correct
	return this;
};

module.exports = Operator;

