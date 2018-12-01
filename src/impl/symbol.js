const { Set, Map, List } = require('immutable');
const Type = require('../ast/type');
const A = require('../arbor');
const dispatch = require('../dispatch');


const bool = function(exp) { return exp ? 'True' : 'False' };

const Symbol = new Type({label: 'Symbol', scope: Set([])});

Symbol.methods = {
	// Symbol composition methods
	// TODO: These should do the same type checking and compile-time analysis
	//       done by the parser and type checker :-)
	"('==':)": dispatch({
		'Symbol': function(s) {
			const label = bool(this.label === s.label);
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
	}),
	"('!=':)": dispatch({
		'Symbol': function(s) {
			const label = bool(this.label !== s.label);
			return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
		},
	}),
	"('+':)": dispatch({
		'Symbol': function(s) {
			return this.update('label', (l) => { return l + s.label; });
		},
	}),
};

module.exports = Symbol;
