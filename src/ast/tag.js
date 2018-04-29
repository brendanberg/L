
const { Map, List, Record } = require('immutable');
const _ = null;
const _map = Map({});
const _list = List([]);


Tag = Record({label: _, tags: _map}, 'Tag');

Tag.prototype.toString = function () {
	return this.label;
};

Tag.prototype.repr = function(depth, style) {
	return style.name(this.label);
};

Tag.prototype.eval = function(ctx) {
	return this;
};

module.exports = Tag;

