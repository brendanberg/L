
const { Map, List, Record } = require('immutable');
const _ = null;
const _map = Map({});
const _list = List([]);


Variant = Record({label: _, values: _list, tags: _map}, 'Variant');

Variant.prototype.toString = function () {
	if (this.values.count()) {
		let values = this.values.map(function(val) { return val.toString(); });
		return this.label + '(' + values.join(', ') + ')';
	} else {
		return this.label;
	}
};

Variant.prototype.repr = function(depth, style) {
	if (this.values.count()) {
		let values = this.values.map(function(val) { return val.repr(depth, style); });
		return (
			style.name(this.label) + style.delimiter('(') +
			values.join(style.delimiter(', ')) + style.delimiter(')')
		);
	} else {
		return style.name(this.label);
	}
};

Variant.prototype.eval = function(ctx) {
	return this;
};

module.exports = Variant;

