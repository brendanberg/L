/*
   Scientific AST node
 */

const { Map, Record } = require('immutable');
const _ = null;
const _map = Map({});


let Scientific = Record({significand: _, mantissa: _, tags: _map}, 'Scientific');

Scientific.prototype.toString = function() {
	return this.significand.toString() + 'e' + this.mantissa.toString();
};

Scientific.prototype.repr = function(depth, style) {
    return style.number(this.toString());
};

Scientific.prototype.eval = function(ctx) {
    return this;
};

Scientific.prototype.transform = function(func) {
    return func(this);
};

module.exports = Scientific;

