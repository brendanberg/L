const { Map, List } = require('immutable');
const Type = require('../ast/type');
const dispatch = require('../dispatch');

function make_bool(exp) {
	return new Variant({label: exp ? 'True' : 'False', tags: Map({type: 'Boolean'})});
}

let Symbol = new Type({label: 'Symbol'});

Symbol.methods = {
	// Symbol composition methods
	// TODO: These should do the same type checking and compile-time analysis
	//       done by the parser and type checker :-)
	"('==':)": dispatch({
		'Symbol': function(s) {
			return make_bool(this.label === s.label);
		},
	}),
	"('!=':)": dispatch({
		'Symbol': function(s) {
			return make_bool(this.label !== s.label);
		},
	}),
	"('+':)": dispatch({
		'Symbol': function(s) {
			return this.update('label', function(l) { return l + s.label; });
		},
	}),
};

module.exports = Symbol;
