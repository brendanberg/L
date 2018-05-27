const { Map, List } = require('immutable');
const Type = require('../ast/type');
const Symbol = require('../ast/symbol');
const dispatch = require('../dispatch');

function make_bool(exp) {
	return new Symbol({label: exp ? 'True' : 'False', tags: Map({type: 'Boolean'})});
}

const SymbolType = new Type({label: 'Symbol'});

SymbolType.methods = {
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

module.exports = SymbolType;
