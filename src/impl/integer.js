const { Map, Range, List: IList } = require('immutable');
const Type = require('../ast/type');
const List = require('../ast/list');
const Integer = require('../ast/integer');
const Rational = require('../ast/rational');
const Variant = require('../ast/variant');
const dispatch = require('../dispatch');


function make_bool(exp) {
	return new Variant({label: exp ? 'True' : 'False', tags: Map({type: 'Boolean'})});
}

let _Integer = new Type({label: 'Integer'});

_Integer.methods = {
	"('+')": function() { return this },
	"('-')": function() { return this.update('value', function(v) { return -v; }); },
	"('..':)": dispatch({
		'Integer': function(n) {
			return new List({items: IList(Range(this.value, n.value).map(function(n) {
				return new Integer({value: n});			
			}))});
		},
	}),
	"('+':)": dispatch({
		'Integer': function(n) {
			return this.update('value', function(v) { return v + n.value; });
		},
		'Rational': function(q) {
			return new Rational({
				numerator: (this.value * q.denominator) + q.numerator,
				denominator: q.denominator
			});
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
			return new Rational({
				numerator: (this.value * q.denominator) - q.numerator,
				denominator: q.denominator
			});
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
			return new Rational({
				numerator: (this.value * q.denominator) * q.numerator,
				denominator: q.denominator
			});
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
			return (new Rational(
				{numerator: this.value, denominator: n.value}
			)).simplify();
		},
		'Rational': function(q) {
			return new Rational({
				numerator: this.value * q.denominator,
				denominator: q.numerator
			});
		},
		'Decimal': function(d) {
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
	"('%':)": dispatch({
		'Integer': function(n) {
			return this.update('value', function(v) { return v % n.value });
		}
	}),
	"('==':)": dispatch({
		'Integer': function(n) {
			return make_bool(this.value === n.value);
		},
		'Rational': function(q) {
			return make_bool(q.denominator == 1 && this.value == q.numerator);
		},
		'Decimal': function(d) {
			return make_bool(d.exponent == 0 && d.numerator == this.value);
		},
	}),
	"('!=':)": dispatch({
		'Integer': function(n) {
			return make_bool(this.value != n.value);
		},
		'Rational': function(q) {
			return make_bool(!(q.denominator == 1 && this.value == q.numerator));
		},
		'Decimal': function(d) {
			return make_bool(!(d.exponent == 0 && d.numerator == this.value));
		},
	}),
	"('<':)": dispatch({
		'Integer': function(n) {
			return make_bool(this.value < n.value);
		},
		'Decimal': function(d) {
			let exponent = Math.pow(10, d.exponent);
			return make_bool(exponent * this.value < d.numerator);
		},
	}),
	"('<=':)": dispatch({
		'Integer': function(n) {
			return make_bool(this.value <= n.value);
		},
		'Decimal': function(d) {
			let exponent = Math.pow(10, d.exponent);
			return make_bool(exponent * this.value < d.numerator || (
				d.exponent == 0 && this.value == d.numerator));
		},
	}),
	"('>':)": dispatch({
		'Integer': function(n) {
			return make_bool(this.value > n.value);
		},
		'Decimal': function(d) {
			let exponent = Math.pow(10, d.exponent);
			return make_bool(exponent * this.value > d.numerator);
		},
	}),
	"('>=':)": dispatch({
		'Integer': function(n) {
			return make_bool(this.value >= n.value);
		},
		'Decimal': function(d) {
			let exponent = Math.pow(10, d.exponent);
			return make_bool(exponent * this.value > d.numerator || (
				d.exponent == 0 && this.value == d.numerator));
		},
	}),
};

module.exports = _Integer;			
