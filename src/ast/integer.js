/*
   Integer AST node
 */

const { Map, Record } = require('immutable');
const _ = null;
const _map = Map({});


let Integer = Record({value: _, scope: _, tags: _map}, 'Integer');

Integer.prototype.toString = function() {
	const baseMap = {
		10: function(x) { return x.toString(); },
		16: function(x) { return '0x' + x.toString(16).toUpperCase(); }
	};
	return baseMap[this.getIn(['tags', 'source_base'], 10)](this.value);
};

Integer.prototype.repr = function(depth, style) {
    return style.number(this.toString());
};

Integer.prototype.eval = function(ctx) {
    return this;
};

Integer.prototype.transform = function(func) {
    return func(this);
};

module.exports = Integer;

