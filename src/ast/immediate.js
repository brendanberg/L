/*
    Immediate AST node
    (Really an IR node)
 */

const { Map, List, Record } = require('immutable');
const Bottom = require('./bottom');

const _ = null;
const _map = Map({});
const _list = List([]);


let Immediate = Record({target: _, tags: _map}, 'Immediate');

Immediate.prototype.toString = function() {
	return '\\' + this.target.toString();
};

Immediate.prototype.repr = function(depth, style) {
	return style.operator('\\') + this.target.repr(depth, style);
};

Immediate.prototype.eval = function(ctx) {
	return this.target.eval(ctx);
};

Immediate.prototype.transform = function(func) {
	let transform = (node) => {
		return node && ('transform' in node) ? node.transform(func) : func(node);
	};

	return func(this.update('target', (target) => { return transform(target); }));
};

module.exports = Immediate;

