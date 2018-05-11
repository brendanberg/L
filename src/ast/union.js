
const { Map, List, Record } = require('immutable');
const _ = null;
const _map = Map({});
const _list = List([]);


Union = Record({label: _, variants: _map, tags: _map}, 'Union');

Union.prototype.toString = function () {
	let variants = this.variants.map(function(node) {
		return node.toString();
	});
	return this.label + ' << ' + variants.valueSeq().join(' | ') + ' >>';
};

Union.prototype.repr = function(depth, style) {
	let variants = this.variants.map(function(node) {
		return node.repr(depth, style);
	});

	return (
		style.name(this.label) + style.delimiter(' << ') + 
		variants.join(style.delimiter(' | ')) + style.delimiter(' >>')
	);
};

Union.prototype.eval = function(ctx) {
	// TODO: WARNING: CONTEXT MUTATION
	let newCtx = {};
	newCtx[this.label] = this;

	ctx.local = ctx.local.merge(newCtx);
	return this;
};

Union.prototype.transform = function(context, match) {
	// Note: This rule should be unreachable if the grammar rules are correct
	return this;
};

Union.prototype.methodForSelector = function(selector) {
	if ('methods' in this) {
		return this.methods[selector];
	} else {
		return null;
	}
};

Union.prototype.registerSelector = function(selector, impl) {
	if ('methods' in this) {
		this.methods[selector] = impl;
	} else {
		this.methods = {};
		this.methods[selector] = impl;
	}
};

module.exports = Union;

