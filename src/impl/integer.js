const { Map } = require('immutable');
const Rational = require('../ast/rational');
const Variant = require('../ast/variant');
const dispatch = require('../dispatch');


function make_bool(exp) {
	return new Variant({label: exp ? 'True' : 'False', tags: Map({type: 'Bool'})});
}

module.exports = Map({
	"('+')": function() { return this },
	"('-')": function() { return this.update('value', function(v) { return -v; }); },
	"('+':)": dispatch({
		'Integer': function(n) {
			return this.update('value', function(v) { return v + n.value; });
		}
	}),
	"('-':)": dispatch({
		'Integer': function(n) {
			return this.update('value', function(v) { return v - n.value; });
		}
	}),
	"('*':)": dispatch({
		'Integer': function(n) {
			return this.update('value', function(v) { return v * n.value; });
		}
	}),
	"('/':)": dispatch({
		'Integer': function(n) {
			return new Rational({numerator: this, denominator: n});
		}
	}),
	"('==':)": dispatch({
		'Integer': function(n) {
			return make_bool(this.value === n.value);
		}
	}),
	"('!=':)": dispatch({
		'Integer': function(n) {
			return make_bool(this.value != n.value);
		}
	}),
	"('<':)": dispatch({
		'Integer': function(n) {
			return make_bool(this.value < n.value);
		}
	}),
	"('>':)": dispatch({
		'Integer': function(n) {
			return make_bool(this.value > n.value);
		}
	}),
	"(test:)": function(n) {
		return new Tag({label: 'Florp', tags: Map({type: 'Pok'})});
	},
});
			
