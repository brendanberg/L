const { Set, Map } = require('immutable');
const Type = require('../ast/type');
const Rational = require('../ast/rational');
const Symbol = require('../ast/symbol');
const dispatch = require('../dispatch');


function make_bool(exp) {
	return new Symbol({
		label: exp ? 'True' : 'False',
		scope: Set([]),
		tags: Map({type: 'Boolean'})
	});
}

let _Rational = new Type({label: 'Rational', scope: Set([])});

_Rational.methods = {
	"('+')": function() { return this },
	"('-')": function() { return this.update('numerator', (v) => { return -v; }); },
	"('+':)": dispatch({
		'Integer': function(n) {
			return this.set('numerator', this.numerator + n.value * this.denominator);
		},
		'Rational': function(q) {
			return new Rational({
				numerator: this.numerator * q.denominator + this.denominator * q.numerator,
				denominator: this.denominator * q.denominator
			});
		},
	}),
	"('-':)": dispatch({
		'Integer': function(n) {
			return this.set('numerator', this.numerator - n.value * this.denominator);
		},
		'Rational': function(q) {
			return new Rational({
				numerator: this.numerator * q.denominator - this.denominator * q.numerator,
				denominator: this.denominator * q.denominator
			});
		},
	}),
	"('*':)": dispatch({
		'Integer': function(n) {
			return this.set('numerator', this.numerator * n.value);
		},
		'Rational': function(q) {
			return new Rational({
				numerator: this.numerator * q.numerator,
				denominator: this.denominator * q.denominator
			});
		},
	}),
	"('/':)": dispatch({
		'Integer': function(n) {
			return this.set('denominator', n.value * this.denominator);
		},
		'Rational': function(q) {
			return new Rational({
				numerator: this.numerator * q.denominator,
				denominator: this.denominator * q.numerator
			});
		},
	}),
	"('==':)": dispatch({
		'Integer': function(n) {
			// TODO: Does this really make sense?
			return make_bool(this.denominator == 1 && this.numerator === n.value);
		},
		'Rational': function(q) {
			return make_bool(this.denominator == q.denominator && 
				this.numerator == q.numerator);
		},
	}),
	"('!=':)": dispatch({
		'Integer': function(n) {
			return make_bool(!(this.denominator == 1 && this.numerator === n.value));
		},
		'Rational': function(q) {
			return make_bool(!(this.denominator == q.denominator && 
				this.numerator == q.numerator));
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

module.exports = _Rational;			
