
const { Map, List, Set, Record } = require('immutable');
const _ = null;
const _map = Map({});
const _list = List([]);


UnionType = Record({label: _, variants: _map, tags: _map}, 'UnionType');

Object.defineProperty(UnionType.prototype, 'scopes', {
	get() { return this._scopes || Set([]); },
	set(scopes) { this._scopes = scopes; }
});

Object.defineProperty(UnionType.prototype, 'binding', {
	get() { return this._binding || null; },
	set(binding) { this._binding = binding }
});

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
	ctx.set(ctx.scope.resolve(this), this);
	return this;
};

UnionType.prototype.transform = function(func) {
	// Note: This rule should be unreachable if the grammar rules are correct
	return func(this);
};

UnionType.prototype.debugString = function () {
	let sc = this.scopes.map((sym)=>{return sym.toString();}).toArray().join(',');
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
