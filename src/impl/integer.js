const { Map } = require('immutable');
const Type = require('../ast/type');
const Rational = require('../ast/rational');
const Variant = require('../ast/variant');
const dispatch = require('../dispatch');


function make_bool(exp) {
	return new Variant({label: exp ? 'True' : 'False', tags: Map({type: 'Bool'})});
}

let _Integer = new Type({label: 'Integer'});

_Integer.methods = {
	"('+')": function() { return this },
	"('-')": function() { return this.update('value', function(v) { return -v; }); },
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
	}),
	"('!=':)": dispatch({
		'Integer': function(n) {
			return make_bool(this.value != n.value);
		},
		'Rational': function(q) {
			return make_bool(!(q.denominator == 1 && this.value == q.numerator));
		},
	}),
	"('<':)": dispatch({
		'Integer': function(n) {
			return make_bool(this.value < n.value);
		}
	}),
	"('<=':)": dispatch({
		'Integer': function(n) {
			return make_bool(this.value <= n.value);
		}
	}),
	"('>':)": dispatch({
		'Integer': function(n) {
			return make_bool(this.value > n.value);
		}
	}),
	"('>=':)": dispatch({
		'Integer': function(n) {
			return make_bool(this.value >= n.value);
		}
	}),
};

module.exports = _Integer;			
