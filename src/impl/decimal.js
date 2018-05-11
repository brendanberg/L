const { Map } = require('immutable');
const Type = require('../ast/type');
const Rational = require('../ast/rational');
const Decimal = require('../ast/decimal');
const Variant = require('../ast/variant');
const dispatch = require('../dispatch');


function make_bool(exp) {
	return new Variant({label: exp ? 'True' : 'False', tags: Map({type: 'Bool'})});
}

let _Decimal = new Type({label: 'Integer'});

_Decimal.methods = {
	"('+')": function() { return this },
	"('-')": function() { return this.update('numerator', function(v) { return -v; }); },
	"('+':)": dispatch({
		'Integer': function(n) {
			let factor = Math.pow(10, this.exponent);
			return this.update('numerator', function(num) {
				return num + n.value * factor;
			});
		},
		'Decimal': function(q) {
			return new Rational({
				numerator: this.value * q.denominator + q.numerator,
				denominator: q.denominator
			});
		},
	}),
	"('-':)": dispatch({
		'Integer': function(n) {
			let factor = Math.pow(10, this.exponent);
			return this.update('numerator', function(num) {
				return num - n.value * factor;
			});
		},
		'Decimal': function(q) {
			return new Rational({
				numerator: this.value * q.denominator + q.numerator,
				denominator: q.denominator
			});
		},
	}),
	"('*':)": dispatch({
		'Integer': function(n) {
			return this.update('numerator', function(num) {
				return num * n.value;
			});
		},
		'Decimal': function(q) {
			return new Decimal({
				numerator: this.numerator * q.numerator,
				exponent: this.exponent + q.exponent
			});
		},
	}),
	"('/':)": dispatch({
		'Integer': function(n) {
			let factor = Math.pow(10, this.exponent);
			return this.update('numerator', function(num) {
				return num + n.value * factor;
			});
		},
		'Decimal': function(q) {
			return new Decimal({
				numerator: this.value * q.denominator + q.numerator,
				exponent: q.denominator
			});
		},
	}),
	"('==':)": dispatch({
		'Integer': function(n) {
			return make_bool(this.exponent == 0 && this.numerator == n.value);
		},
		'Decimal': function(d) {
			return make_bool(this.numerator == d.numerator &&
				this.exponent == d.exponent);
		},
	}),
	"('!=':)": dispatch({
		'Integer': function(n) {
			return make_bool(!(this.exponent == 0 && this.numerator == n.value));
		},
		'Decimal': function(q) {
			return make_bool(!(this.numerator == d.numerator &&
				this.exponent == d.exponent));
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

module.exports = _Decimal;			
