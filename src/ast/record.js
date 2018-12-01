
const { Map, List, Set, Record } = require('immutable');
const _ = null;
const _map = Map({});
const _list = List([]);


Record_ = Record({label: _, fields: _map, scope: _, tags: _map}, 'Record');


Record_.prototype.toString = function () {
	return this.label + '(' + this.fields.map(function(val, key) {
		return key + ': ' + val.toString();
	}).join(', ') + ')';
};

Record_.prototype.repr = function(depth, style) {
	return (
		style.name(this.label) + style.delimiter('(') +
		this.fields.map(function(val, key) {
			return style.name(key) + style.delimiter(': ') + val.repr(depth, style);
		}).join(style.delimiter(', ')) + style.delimiter(')')
	);
};

Record_.prototype.eval = function(ctx) {
	return [this, ctx];
};

Record_.prototype.transform = function(func) {
	return func(this);
};

module.exports = Record_;
