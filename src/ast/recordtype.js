
const { Map, List, Set, Record } = require('immutable');
const _ = null;
const _map = Map({});
const _list = List([]);
const Identifier = require('./identifier');


RecordType = Record({label: _, members: _list, binding: _, scope: _, tags: _map}, 'RecordType');

RecordType.prototype.toString = function () {
	let members = this.members.map(function(node) {
		return node.toString();
	});
	return this.label + ' << ' + members.join(', ') + ' >>';
};

RecordType.prototype.repr = function (depth, style) {
	let members = this.members.map(function(node) {
		return node.repr(depth, style);
	});

	return (
		style.name(this.label) + 
		style.delimiter(' << ') +
		members.join(style.delimiter(', ')) +
		style.delimiter(' >>')
	);
};

RecordType.prototype.eval = function(ctx) {
	ctx.set(this.binding, this);
	return this;
};

RecordType.prototype.transform = function(func) {
	// Note: This rule should be unreachable if the grammar rules are correct
	return func(this);
};

RecordType.prototype.debugString = function () {
	let sc = this.scope.map((sym)=>{return sym.toString();}).toArray().join(',');
	let binding = this.binding ? this.binding.toString() : '--';

	return `{${this.label}}[${sc}]: ${binding}`;
};

RecordType.prototype.methodForSelector = function(selector) {
	if ('methods' in this) {
		return this.methods[selector];
	} else {
		return null;
	}
};

RecordType.prototype.registerSelector = function(selector, impl) {
	if ('methods' in this) {
		this.methods[selector] = impl;
	} else {
		this.methods = {};
		this.methods[selector] = impl;
	}
};

module.exports = RecordType;
