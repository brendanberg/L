
const { Map, List, Record } = require('immutable');
const Bottom = require('./bottom');
const _ = null;
const _map = Map({});
const _list = List([]);


Type = Record({label: _, tags: _map}, 'Type');

Type.prototype.toString = function () {
	return this.label.toString();
};

Type.prototype.repr = function (depth, fmt) {
	return this.toString();
};

Type.prototype.transform = function(context, match) {
	return new Bottom();
};

Type.prototype.methodForSelector = function(selector) {
	if ('methods' in this) {
		return this.methods[selector];
	} else {
		return null;
	}
};

Type.prototype.registerSelector = function(selector, impl) {
	if ('methods' in this) {
		this.methods[selector] = impl;
	} else {
		this.methods = {};
		this.methods[selector] = impl;
	}
};

module.exports = Type;

