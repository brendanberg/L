/*
   Rational AST node
 */

const { Map, Record } = require('immutable');
const _ = null;
const _map = Map({});

function gcd(a, b) {
	// Yikes, JS maths o_O
	if (b == 0) { return a; }
	return gcd(b, a % b);
}

const Rational = Record({numerator: _, denominator: _, scope: _, tags: _map}, 'Rational');

Rational.prototype.toString = function() {
	let rat = this.simplify();
	let denom = rat.denominator === 1 ? "" : " / " + rat.denominator.toString();
	return rat.numerator.toString() + denom;
};

Rational.prototype.repr = function(depth, style) {
    return style.number(this.toString());
};

Rational.prototype.simplify = function() {//ctx) {
	var x = gcd(this.numerator, this.denominator);
	return this.merge({
		numerator: this.numerator / x,
		denominator: this.denominator / x
	});
};

Rational.prototype.eval = function(ctx) {
	// Simplify the fraction first
    return this.simplify(ctx);
};

Rational.prototype.transform = function(func) {
    return func(this);
};

module.exports = Rational;

