/*
   Complex AST node
 */

const { Map, Record } = require('immutable');
const _ = null;
const _map = Map({});


let Complex = Record({real: _, imaginary: _, scope: _, tags: _map}, 'Complex');

Complex.prototype.toString = function() {
	let real = this.get('real', null);
	return (real ? real.toString() + " + " : '') + this.imaginary.toString() + 'j';
};

Complex.prototype.repr = function(depth, style) {
	let real = this.get('real', null);
	let repr = '';
	if (real) {
		repr = style.number(real.toString()) + style.number(' + ');
	}
	return repr + style.number(this.imaginary.toString() + 'j');
};

Complex.prototype.eval = function(ctx) {
    return [this, ctx];
};

Complex.prototype.transform = function(func) {
    return func(this);
};

module.exports = Complex;
