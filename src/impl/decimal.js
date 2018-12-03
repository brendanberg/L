const { Set, Map } = require('immutable');
const Type = require('../ast/type');
const A = require('../arbor');
const dispatch = require('../dispatch');


const bool = function(exp) { return exp ? 'True' : 'False' };

let _Decimal = new Type({label: 'Decimal', scope: Set([])});

_Decimal.methods = {
	"('+')": function() { return this },
	"('-')": function() { return this.update('numerator', (v) => { return -v; }); },
	'(sqrt.)': function() {
		// WARNING! There's a loss of precision here!
		let inexact = Math.sqrt(this.numerator * Math.pow(10, -this.exponent));

		return A.pushScope(this.scope)(A.Decimal(inexact.toString()));
	},
	"('+':)": dispatch({
		'Integer': function(n) {
			let factor = Math.pow(10, this.exponent);
			return this.update('numerator', (num) => {
				return num + n.value * factor;
			});
		},
		'Decimal': function(q) {
			let numerator = this.value * q.denominator + q.numerator;
			return A.pushScope(this.scope)(A.Rational(numerator, q.denominator));
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
			let numerator = this.value * q.denominator + q.numerator;
			return A.pushScope(this.scope)(A.Rational(numerator, q.denominator));
		},
	}),
	"('*':)": dispatch({
		'Integer': function(n) {
			return this.update('numerator', (num) => {
				return num * n.value;
			});
		},
		'Decimal': function(q) {
			return A.pushScope(this.scope)(
				A.Decimal(this.numerator * q.numerator, this.exponent + q.exponent)
			);
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
			const numerator = this.numerator;// * Math.pow(10, this.exponent);
			const denominator = q.numerator;// * Math.pow(10, q.exponent);
			const dexp = q.exponent - this.exponent;
			let exp, quotient = numerator / denominator;

			const precision = (num) => {
				if (!isFinite(num)) { return 0; }
				let e = 1, p = 0;
				while (Math.round(num * e) / e !== num) { e *= 10; p += 1; }
				return p;
			};

			if (dexp >= 0) {
				quotient = quotient * Math.pow(10, dexp);
				let prec = precision(quotient);

				if (prec > 0) {
					exp = Math.min(prec, 8);
					quotient = quotient * Math.pow(10, exp);
				} else {
					exp = 0;
				}
			} else {
				exp = -dexp;
			}

			return A.pushScope(this.scope)(A.Decimal(quotient, exp));
		},
	}),
	"('^':)": dispatch({
		'Integer': function(n) {
			if (n.value < 0) {
				// WARNING! There's a loss of precision here!
				let inexact = 1 / Math.pow(this.numerator, -n.value);
				return A.pushScope(this.scope)(A.Decimal(inexact.toString()));
			} else {
				return this.update('numerator', (v) => {
					return Math.pow(v, n.value);
				}).update('exponent', (e) => { return e * n.value; });
			}
		},
	}),
	"('==':)": dispatch({
		'Integer': function(n) {
			const label = bool(this.exponent == 0 && this.numerator == n.value);
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
		'Decimal': function(d) {
			const label = bool(this.numerator == d.numerator &&
				this.exponent == d.exponent);
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
	}),
	"('!=':)": dispatch({
		'Integer': function(n) {
			const label = bool(!(this.exponent == 0 && this.numerator == n.value));
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
		'Decimal': function(q) {
			const label = bool(!(this.numerator == d.numerator &&
				this.exponent == d.exponent));
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
	}),
	"('<':)": dispatch({
		'Integer': function(n) {
			let exponent = Math.pow(10, this.exponent);
			const label = bool(this.numerator < n.value * exponent);
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
		'Decimal': function(d) {
			let exponent = Math.pow(10, this.exponent - d.exponent);
			const label = bool(this.numerator < d.numerator * exponent);
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
	}),
	"('<=':)": dispatch({
		'Integer': function(n) {
			let exponent = Math.pow(10, this.exponent);
			const label = bool(this.numerator < n.value * exponent || (
				this.exponent == 0 && this.numerator == n.value));
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
		'Decimal': function(d) {
			let exponent = Math.pow(10, this.exponent - d.exponent);
			const label = bool(this.numerator <= d.numerator * exponent);
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
	}),
	"('>':)": dispatch({
		'Integer': function(n) {
			let exponent = Math.pow(10, this.exponent);
			const label = bool(this.numerator > n.value * exponent);
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
		'Decimal': function(d) {
			let exponent = Math.pow(10, this.exponent - d.exponent);
			const label = bool(this.numerator > d.numerator * exponent);
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
	}),
	"('>=':)": dispatch({
		'Integer': function(n) {
			let exponent = Math.pow(10, this.exponent);
			const label = bool(this.numerator > n.value * exponent || (
				this.exponent == 0 && this.numerator == n.value));
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
		'Decimal': function(d) {
			let exponent = Math.pow(10, this.exponent - d.exponent);
			const label = bool(this.numerator >= d.numerator * exponent);
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
	}),
};

module.exports = _Decimal;			
