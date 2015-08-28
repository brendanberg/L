var AST = require('../ast');
var dispatch = require('../dispatch');

(function(AST) {
	AST.Block.prototype.ctx = {
		//TODO: Figure out how to do two-step invocations...
		// Invoke on an invokable should eval, on anything else
		// should be a no-op.
		"('\\')": function() {
			return this.expressionList.eval(this.ctx);
		}
	};
})(AST);
