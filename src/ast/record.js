
const { Map, List, Set, Record } = require('immutable');
const _ = null;
const _map = Map({});
const _list = List([]);


Record_ = Record({label: _, fields: _map, tags: _map}, 'Record');

Object.defineProperty(Record_.prototype, 'scopes', {
	get() {
		if (this._scopes === undefined) {
			this._scopes = Set([]);
		}
		return this._scopes
	},
	set(scopes) { this._scopes = scopes; }
});


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
	return this;
};

module.exports = Record_;
