var AST = require('../ast');
var dispatch = require('../dispatch');

(function(AST) {
	module.exports = {
		String: {
			"('+':)": AST.Method({
					'type': this,
					'target': null,
					'plist': null,
					'block': null,
			})
		}
	}
})(AST);

/*
	 - Primitive types (numbers, text, lists, maps)

	 - User-defined types (variants, records)
	   - Mutate the module (but as a semilattice?)

	 - Blocks
	   - Have a context? (not pure)

	 - Operators on syntax ("macros"? like arrow, match)

	 Determine the context, then evaluate the value
	 The interpreter needs to define base types and default implementations.
	 Numbers use the host platform's immplementation.
	 
 */
