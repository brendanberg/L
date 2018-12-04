const { Map, List, Set, Record } = require('immutable');
const _ = null;
const _map = Map({});
const _list = List([]);


const MachineType = Record({
	label: _, interfaces: _list, bits: _, binding: _, scope: _, tags: _map}, 'MachineType');

MachineType.prototype.toString = function() {
	let ifaceStr;

	if (interfaces.count() > 0) {
		ifaceStr = interfaces.join(' + ') + ' : ';
	} else {
		ifaceStr = '';
	}

	return this.label + ' << ' + ifaceStr + this.bits + ' >>';
}

MachineType.prototype.repr = function(depth, style) {
	let ifaceStr;

	if (this.interfaces.count() > 0) {
		ifaceStr = this.interfaces.map((i) =>
			i.repr(depth, style)).join(style.delimiter(' + ')) + style.delimiter(' : ');
	} else {
		ifaceStr = '';
	}

	return (
		style.name(this.label) +
		style.delimiter(' << ') +
		ifaceStr +
		style.number(this.bits) +
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
