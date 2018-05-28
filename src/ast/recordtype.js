
const { Map, List, Record: IRecord } = require('immutable');
const _ = null;
const _map = Map({});
const _list = List([]);


RecordType = IRecord({label: _, members: _list, ctx: _, tags: _map}, 'RecordType');

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
	var signature = '(' + this.members.map(function(x) {
		return x.label + ':'
	}).join('') + ')';

	let newCtx = {};
	newCtx[this.label] = this;
	ctx.local = ctx.local.merge(newCtx);
	return this;
};

RecordType.prototype.transform = function(context, match) {
	// Note: This rule should be unreachable if the grammar rules are correct
	return this;
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
