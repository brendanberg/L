const { Set, Map, List } = require('immutable');
const Type = require('../ast/type');
const Symbol = require('../ast/symbol');
const Bottom = require('../ast/bottom');
const dispatch = require('../dispatch');

function make_bool(exp) {
	return new Symbol({
		label: exp ? 'True' : 'False',
		scope: Set([]),
		tags: Map({type: 'Boolean'})
	});
}

let Block = new Type({label: 'Block', scope: Set([])});

Block.methods = {
	// Block composition methods
	// TODO: These should do the same type checking and compile-time analysis
	//       done by the parser and type checker :-)
	"('+':)": dispatch({
		'Block': function(b) {
			return this.update('exprs', (e) => { return e.concat(b.exprs); });
		},
	}),
	'(append:)': function(exp) {
		return this.update('exprs', (e) => { return e.push(exp); });
	},
	'(evaluateWithContext:)': function(ctx) {
		// TODO:
	},
};

module.exports = Block;
