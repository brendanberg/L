const { Map } = require('immutable');
const Type = require('../ast/type');
const Rational = require('../ast/rational');
const Variant = require('../ast/variant');
const dispatch = require('../dispatch');


function make_bool(exp) {
	return new Variant({label: exp ? 'True' : 'False', tags: Map({type: 'Bool'})});
}

let _Rational = new Type({label: 'Integer'});

_Rational.methods = {
	"('+')": function() { return this },
	"('-')": function() { return this.update('numerator', function(v) { return -v; }); },
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
