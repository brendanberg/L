
const { Map, List, Set, Record } = require('immutable');
const _ = null;
const _map = Map({});
const _list = List([]);


UnionType = Record({
		label: _, interfaces: _list, variants: _map,
		binding: _, scope: _, tags: _map
	}, 'UnionType');

UnionType.prototype.toString = function () {
	let interfaces, variants = this.variants.map((node) => node.toString());

	if (this.interfaces.count() > 0) {
		interfaces = ' (' + this.interfaces.join(', ') + ')';
	} else {
		interfaces = '';
	}

	return this.label + interfaces + ' << ' + variants.join(' | ') + ' >>';
};

UnionType.prototype.repr = function(depth, style) {
	let interfaces, variants = this.variants.map((node) => node.repr(depth, style));

	if (this.interfaces.count() > 0) {
		interfaces = style.delimiter(' (') + this.interfaces.map((i) =>
			style.name(i)).join(style.delimiter(', ')) + style.delimiter(')');
	} else {
		interfaces = '';
	}

	return (
		style.name(this.label) + interfaces + style.delimiter(' << ') +
		variants.join(style.delimiter(' | ')) + style.delimiter(' >>')
	);
};

UnionType.prototype.eval = function(ctx) {
	ctx.set(this.binding, this);
	return [this, ctx];
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
