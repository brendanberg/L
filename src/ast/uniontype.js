
const { Map, List, Set, Record } = require('immutable');
const _ = null;
const _map = Map({});
const _list = List([]);


UnionType = Record({label: _, variants: _map, binding: _, scope: _, tags: _map}, 'UnionType');

UnionType.prototype.toString = function () {
	let variants = this.variants.map(function(node) {
		return node.toString();
	});
	return this.label + ' << ' + variants.valueSeq().join(' | ') + ' >>';
};

UnionType.prototype.repr = function(depth, style) {
	let variants = this.variants.map(function(node) {
		return node.repr(depth, style);
	});

	return (
		style.name(this.label) + style.delimiter(' << ') + 
		variants.join(style.delimiter(' | ')) + style.delimiter(' >>')
	);
};

UnionType.prototype.eval = function(ctx) {
	ctx.set(this.binding, this); // TODO: Previously, this was a dynamic resolution...
	return this;
};

UnionType.prototype.transform = function(func) {
	// Note: This rule should be unreachable if the grammar rules are correct
	return func(this);
};

UnionType.prototype.debugString = function () {
	let sc = this.scope.map((sym)=>{return sym.toString();}).toArray().join(',');
	let binding = this.binding ? this.binding.toString() : '--';

	return `{${this.label}}[${sc}]: ${binding}`;
};

UnionType.prototype.methodForSelector = function(selector) {
	if ('methods' in this) {
		return this.methods[selector];
	} else {
		return null;
	}
};

UnionType.prototype.registerSelector = function(selector, impl) {
	if ('methods' in this) {
		this.methods[selector] = impl;
	} else {
		this.methods = {};
		this.methods[selector] = impl;
	}
};

module.exports = UnionType;
