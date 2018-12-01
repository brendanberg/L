const { Map, Range, Set, List } = require('immutable');
const Type = require('../ast/type');
const A = require('../arbor');
const dispatch = require('../dispatch');


const bool = function(exp) { return exp ? 'True' : 'False' };

let Integer_ = new Type({label: 'Integer', scope: Set([])});

Integer_.methods = {
	"('+')": function() { return this },
	"('-')": function() { return this.update('value', function(v) { return -v; }); },
	'(sqrt.)': function() {
		// WARNING! There's a loss of precision here!
		let inexact = Math.sqrt(this.value);
		return A.pushScope(this.scope)(A.Decimal(inexact.toString()));
	},
	"('..':)": dispatch({
		'Integer': function(n) {
			let items = Range(this.value, n.value).map((n) => A.Integer(n));
			return A.pushScope(this.scope)(A.List(...items));
		},
	}),
	"('..|':)": dispatch({
		'Integer': function(n) {
			let items = Range(this.value, n.value).map((n) => A.Integer(n));
			return A.pushScope(this.scope)(A.List(...items));
		},
	}),
	"('...':)": dispatch({
		'Integer': function(n) {
			let items = Range(this.value, n.value + 1).map((n) => A.Integer(n));
			return A.pushScope(this.scope)(A.List(...items));
		},
	}),
	"('+':)": dispatch({
		'Integer': function(n) {
			return this.update('value', function(v) { return v + n.value; });
		},
		'Rational': function(q) {
			return A.pushScope(this.scope)(
				A.Rational((this.value * q.denominator) + q.numerator, q.denominator)
			);
		},
		'Decimal': function(d) {
			let factor = Math.pow(10, d.exponent);
			let self = this;
			return d.update('numerator', function(num) {
				return num + self.value * factor;
			});
		},
		'Complex': function(c) {
			return c.update('real', (r) => {
				// Invoke r('+': this)
				r.ctx = this.ctx;
				let method = this.ctx.lookup(r._name).methodForSelector("('+':)");
				return method.apply(r, [this]);
			});
		},
	}),
	"('-':)": dispatch({
		'Integer': function(n) {
			return this.update('value', function(v) { return v - n.value; });
		},
		'Rational': function(q) {
			let numerator = (this.value * q.denominator) - q.numerator;
			return A.pushScope(this.scope)(A.Rational(numerator, q.denominator));
		},
		'Decimal': function(d) {
			let factor = Math.pow(10, d.exponent);
			let self = this;
			return d.update('numerator', function(num) {
				return num - self.value * factor;
			});
		},
		'Complex': function(c) {
			return c.update('real', (r) => {
				// Invoke this('-': r)
				let method = this.ctx.lookup(this._name).methodForSelector("('-':)");
				return method.apply(this, [r]);
			}).update('imaginary', (j) => {
				let method = this.ctx.lookup(j._name).methodForSelector("('-')");
				return method.apply(j, []);
			});
		},
	}),
	"('*':)": dispatch({
		'Integer': function(n) {
			return this.update('value', function(v) { return v * n.value; });
		},
		'Rational': function(q) {
			let numerator = (this.value * q.denominator) * q.numerator;
			return A.pushScope(this.scope)(A.Rational(numerator, q.denominator));
		},
		'Decimal': function(d) {
			let self = this;
			return d.update('numerator', function(num) {
				return num * self.value;
			});
		},
		'Complex': function(c) {
			// (a+bi)(c+di) = (ac−bd) + (ad+bc)i
			return c.update('real', (r) => {
				// Invoke this('*': r)
				let method = this.ctx.lookup(this._name).methodForSelector("('*':)");
				return method.apply(this, [r]);
			}).update('imaginary', (j) => {
				// Invoke this('*': j)
				let method = this.ctx.lookup(this._name).methodForSelector("('*':)");
				return method.apply(this, [j]);
			});
		},
	}),
	"('/':)": dispatch({
		'Integer': function(n) {
			return A.pushScope(this.scope)(A.Rational(this.value, n.value));
		},
		'Rational': function(q) {
			return A.pushScope(this.scope)(A.Rational(this.value * q.denominator, q.numerator));
		},
		'Decimal': function(d) {
			// TODO: FIX THE MATH HERE
			let self = this;
			return d.update('numerator', function(num) {
				return num * self.value;
			});
		},
	}),
	"('//':)": dispatch({
		'Integer': function(n) {
			return this.update('value', function(v) { return Math.floor(v / n.value); });
		}
	}),
	"('^':)": dispatch({
		'Integer': function(n) {
			if (n.value < 0) {
				return A.pushScope(this.scope)(A.Rational(1, Math.pow(this.value, -n.value)));
			} else {
				return this.update('value', (v) => { return Math.pow(v, n.value); });
			}
		},
	}),
	"('%':)": dispatch({
		'Integer': function(n) {
			return this.update('value', function(v) { return v % n.value });
		}
	}),
	"('==':)": dispatch({
		'Integer': function(n) {
			let label = bool(this.value === n.value);
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
		'Rational': function(q) {
			let label = bool(q.denominator == 1 && this.value == q.numerator);
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
		'Decimal': function(d) {
			let label = bool(d.exponent == 0 && d.numerator == this.value);
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
	}),
	"('!=':)": dispatch({
		'Integer': function(n) {
			let label = bool(this.value != n.value);
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
		'Rational': function(q) {
			let label = bool(!(q.denominator == 1 && this.value == q.numerator));
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
		'Decimal': function(d) {
			let label = bool(!(d.exponent == 0 && d.numerator == this.value));
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
	}),
	"('<':)": dispatch({
		'Integer': function(n) {
			let label = bool(this.value < n.value);
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
		'Decimal': function(d) {
			let exponent = Math.pow(10, d.exponent);
			let label = bool(exponent * this.value < d.numerator);
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
	}),
	"('<=':)": dispatch({
		'Integer': function(n) {
			let label = bool(this.value <= n.value);
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
		'Decimal': function(d) {
			let exponent = Math.pow(10, d.exponent);
			let label = bool(exponent * this.value < d.numerator || (
				d.exponent == 0 && this.value == d.numerator));
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
	}),
	"('>':)": dispatch({
		'Integer': function(n) {
			let label = bool(this.value > n.value);
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
		'Decimal': function(d) {
			let exponent = Math.pow(10, d.exponent);
			let label = bool(exponent * this.value > d.numerator);
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
	}),
	"('>=':)": dispatch({
		'Integer': function(n) {
			let label = bool(this.value >= n.value);
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
		'Decimal': function(d) {
			let exponent = Math.pow(10, d.exponent);
			let label = bool(exponent * this.value > d.numerator || (
				d.exponent == 0 && this.value == d.numerator));
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
	}),
};

module.exports = Integer_;			
