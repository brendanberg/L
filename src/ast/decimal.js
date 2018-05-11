/*
   Decimal AST node
 */

const { Map, Record } = require('immutable');
const _ = null;
const _map = Map({});


// Decimal numbers are represented as a numerator and exponent.
//   1.         num:     1,  exp:  0
//   1.0        num:    10,  exp:  1
//   0.0125     num:   125,  exp:  4
// 157.01       num: 15701,  exp:  2
let Decimal = Record({numerator: _, exponent: _, tags: _map}, 'Decimal');

Decimal.prototype.toString = function() {
	let exponent = Math.pow(10, this.exponent);
	let abs = Math.abs(this.numerator);
	let wholePart = Math.floor(abs / exponent);
	let fraction = this.exponent ? this.zeroPad(abs % exponent, this.exponent) : '';
	let sign = (Math.sign(this.numerator) >= 0) ? '' : '-';

	return sign + wholePart.toString() + '.' + fraction;
};

Decimal.prototype.repr = function(depth, style) {
    return style.number(this.toString());
};

Decimal.prototype.zeroPad = function (num, len) {
	let n = Math.abs(num);
	let zeros = Math.max(0, len - Math.floor(n).toString().length);
	let zeroString = Math.pow(10, zeros).toString().substr(1);
	return zeroString + n;
};

Decimal.prototype.eval = function(ctx) {
    return this;
};

Decimal.prototype.transform = function(func) {
    return func(this);
};

module.exports = Decimal;

