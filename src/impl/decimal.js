const { Set, Map } = require('immutable');
const Type = require('../ast/type');
const Rational = require('../ast/rational');
const Decimal = require('../ast/decimal');
const Symbol = require('../ast/symbol');
const dispatch = require('../dispatch');


function make_bool(exp) {
	return new Symbol({
		label: exp ? 'True' : 'False',
		scope: Set([]),
		tags: Map({type: 'Boolean'})
	});
}

let _Decimal = new Type({label: 'Decimal', scope: Set([])});

_Decimal.methods = {
	"('+')": function() { return this },
	"('-')": function() { return this.update('numerator', (v) => { return -v; }); },
	'(sqrt.)': function() {
		// WARNING! There's a loss of precision here!
		let inexact = Math.sqrt(this.numerator * Math.pow(10, -this.exponent));
		let precision = 12;

		return new Decimal({
			numerator: Math.floor(inexact * Math.pow(10, precision)),
			exponent: precision
		});
	},
	"('+':)": dispatch({
		'Integer': function(n) {
			let factor = Math.pow(10, this.exponent);
			return this.update('numerator', (num) => {
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
			return this.update('numerator', (num) => {
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
			return this.update('numerator', (num) => {
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
			return this.update('numerator', (num) => {
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
	"('^':)": dispatch({
		'Integer': function(n) {
			if (n.value < 0) {
				// WARNING! There's a loss of precision here!
				let inexact = 1 / Math.pow(this.numerator, -n.value);
				let precision = 12;

				return new Decimal({
					numerator: Math.floor(inexact * Math.pow(10, precision - n.value)),
					exponent: precision
				});
			} else {
				return this.update('numerator', (v) => {
					return Math.pow(v, n.value);
				}).update('exponent', (e) => { return e * n.value; });
			}
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
			let exponent = Math.pow(10, this.exponent);
			return make_bool(this.numerator < n.value * exponent);
		},
		'Decimal': function(d) {
			let exponent = Math.pow(10, this.exponent - d.exponent);
			return make_bool(this.numerator < d.numerator * exponent);
		},
	}),
	"('<=':)": dispatch({
		'Integer': function(n) {
			let exponent = Math.pow(10, this.exponent);
			return make_bool(this.numerator < n.value * exponent || (
				this.exponent == 0 && this.numerator == n.value));
		},
		'Decimal': function(d) {
			let exponent = Math.pow(10, this.exponent - d.exponent);
			return make_bool(this.numerator <= d.numerator * exponent);
		},
	}),
	"('>':)": dispatch({
		'Integer': function(n) {
			let exponent = Math.pow(10, this.exponent);
			return make_bool(this.numerator > n.value * exponent);
		},
		'Decimal': function(d) {
			let exponent = Math.pow(10, this.exponent - d.exponent);
			return make_bool(this.numerator > d.numerator * exponent);
		},
	}),
	"('>=':)": dispatch({
		'Integer': function(n) {
			let exponent = Math.pow(10, this.exponent);
			return make_bool(this.numerator > n.value * exponent || (
				this.exponent == 0 && this.numerator == n.value));
		},
		'Decimal': function(d) {
			let exponent = Math.pow(10, this.exponent - d.exponent);
			return make_bool(this.numerator >= d.numerator * exponent);
		},
	}),
};

module.exports = _Decimal;			
