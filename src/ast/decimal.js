/*
   Decimal AST node
 */

const { Map, Record } = require('immutable');
const _ = null;
const _map = Map({});


let Decimal = Record({numerator: _, exponent: _, tags: _map}, 'Decimal');

Decimal.prototype.toString = function() {
	let exponent = Math.pow(10, this.exponent);
	let wholePart = Math.floor(this.numerator / exponent);
	let fraction = this.exponent ? this.zeroPad(this.numerator % exponent, this.exponent) : '';
	return wholePart.toString() + "." + fraction;
};

Decimal.prototype.repr = function(depth, style) {
    return style.number(this.toString());
};

Decimal.prototype.zeroPad = function (num, len) {
	let n = Math.abs(num);
	let zeros = Math.max(0, len - Math.floor(n).toString().length);
	let zeroString = Math.pow(10, zeros).toString().substr(1);
	if (num < 0) {
		zeroString = '-' + zeroString;
	}
	return zeroString + n;
};

Decimal.prototype.eval = function(ctx) {
    return this;
};

Decimal.prototype.transform = function(func) {
    return func(this);
};

module.exports = Decimal;

