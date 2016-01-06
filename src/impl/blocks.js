var AST = require('../ast');
var dispatch = require('../dispatch');

(function(AST) {
	module.exports = {
		Block: {
			//TODO: Figure out how to do two-step invocations...
			// Invoke on an invokable should eval, on anything else
			// should be a no-op.
			"('\\')": function() {
				console.log('backslash op');
				return this.expressionList.eval(this.ctx);
			}
		}
	};
})(AST);
