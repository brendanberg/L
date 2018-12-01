const { Set, Map } = require('immutable');
const Type = require('../ast/type');
const A = require('../arbor');
const dispatch = require('../dispatch');


const bool = function(exp) { return exp ? 'True' : 'False' };

let Rational = new Type({label: 'Rational', scope: Set([])});

Rational.methods = {
	"('+')": function() { return this },
	"('-')": function() { return this.update('numerator', (v) => { return -v; }); },
	"('+':)": dispatch({
		'Integer': function(n) {
			return this.set('numerator', this.numerator + n.value * this.denominator);
		},
		'Rational': function(q) {
			const numerator = this.numerator * q.denominator + this.denominator * q.numerator;
			const denominator = this.denominator * q.denominator;
			return A.pushScope(this.scope)(A.Rational(numerator, denominator));
		},
	}),
	"('-':)": dispatch({
		'Integer': function(n) {
			return this.set('numerator', this.numerator - n.value * this.denominator);
		},
		'Rational': function(q) {
			const numerator = this.numerator * q.denominator - this.denominator * q.numerator;
			const denominator = this.denominator * q.denominator;
			return A.pushScope(this.scope)(A.Rational(numerator, denominator));
		},
	}),
	"('*':)": dispatch({
		'Integer': function(n) {
			return this.set('numerator', this.numerator * n.value);
		},
		'Rational': function(q) {
			const numerator = this.numerator * q.numerator;
			const denominator = this.denominator * q.denominator;
			return A.pushScope(this.scope)(A.Rational(numerator, denominator));
		},
	}),
	"('/':)": dispatch({
		'Integer': function(n) {
			return this.set('denominator', n.value * this.denominator);
		},
		'Rational': function(q) {
			const numerator = this.numerator * q.denominator;
			const denominator = this.denominator * q.numerator;
			return A.pushScope(this.scope)(A.Rational(numerator, denominator));
		},
	}),
	"('==':)": dispatch({
		'Integer': function(n) {
			// TODO: Does this really make sense?
			const label = bool(this.denominator == 1 && this.numerator === n.value);
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
		'Rational': function(q) {
			const label = bool(this.denominator == q.denominator && 
				this.numerator == q.numerator);
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
	}),
	"('!=':)": dispatch({
		'Integer': function(n) {
			const label = bool(!(this.denominator == 1 && this.numerator === n.value));
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
		'Rational': function(q) {
			const label = bool(!(this.denominator == q.denominator && 
				this.numerator == q.numerator));
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
	}),
	"('<':)": dispatch({
	}),
	"('<=':)": dispatch({
	}),
	"('>':)": dispatch({
	}),
	"('>=':)": dispatch({
	}),
};

module.exports = Rational;			
