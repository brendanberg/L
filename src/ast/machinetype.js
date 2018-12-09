const { Map, List, Set, Record } = require('immutable');
const _ = null;
const _map = Map({});
const _list = List([]);


const MachineType = Record({
	label: _, interfaces: _list, bitlayout: _list, binding: _, scope: _, tags: _map}, 'MachineType');

MachineType.prototype.toString = function() {
	let interfaces, bitlayout = this.bitlayout.toJS().join(', ');

	if (this.interfaces.count() > 0) {
		interfaces = ' (' + this.interfaces.join(', ') + ')';
	} else {
		interfaces = '';
	}

	return this.label + interfaces + ' << ' + bitlayout + ' >>';
}

MachineType.prototype.repr = function(depth, style) {
	let interfaces, bitlayout = this.bitlayout.map((bits) =>
			style.number(bits)).toJS().join(style.delimiter(', '));

	if (this.interfaces.count() > 0) {
		interfaces = style.delimiter(' (') + this.interfaces.map((i) =>
			style.name(i)).join(style.delimiter(', ')) + style.delimiter(')');
	} else {
		interfaces = '';
	}

	return (
		style.name(this.label) +
		interfaces +
		style.delimiter(' << ') +
		bitlayout +
		style.delimiter(' >>')
	);
};

MachineType.prototype.eval = function(ctx) {
	ctx.set(this.binding, this);
	return [this, ctx];
};

MachineType.prototype.transform = function(func) {
	return func(this);
};

MachineType.prototype.debugString = function () {
	let sc = this.scope.map((sym)=>{return sym.toString();}).toArray().join(',');
	let binding = this.binding ? this.binding.toString() : '--';

	return `{${this.label}}[${sc}]: ${binding}`;
};

MachineType.prototype.methodForSelector = function(selector) {
	if ('methods' in this) {
		return this.methods[selector];
	} else {
		return null;
	}
};

MachineType.prototype.registerSelector = function(selector, impl) {
	if (!('methods' in this)) {
		this.methods = {};
	}

	this.methods[selector] = impl;
};

module.exports = MachineType;
