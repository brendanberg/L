
const { Map, List, Record } = require('immutable');
const _ = null;
const _map = Map({});
const _list = List([]);


Value = Record({label: _, fields: _map, tags: _map}, 'Value');

Value.prototype.toString = function () {
	return this.label + '(' + this.fields.map(function(val, key) {
		return key + ': ' + val.toString();
	}).join(', ') + ')';
};

Value.prototype.repr = function(depth, style) {
	return (
		style.name(this.label) + style.delimiter('(') +
		this.fields.map(function(val, key) {
			return style.name(key) + style.delimiter(': ') + val.repr(depth, style);
		}).join(style.delimiter(', ')) + style.delimiter(')')
	);
};

Value.prototype.eval = function(ctx) {
	return this;
};

module.exports = Value;
