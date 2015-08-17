var AST = require('../ast');
var dispatch = require('../dispatch');

(function(AST) {
	AST.Block.prototype.ctx = {
		'\\': dispatch({
			'': function() {
				//TODO: Figure out how to do two-step invocations...
				// Invoke on an invokable should eval, on anything else
				// should be a no-op.

				// return new AST.Invocation(
				// 	this, new AST.List([], {source: 'parameterList'})
				// );
				return this.expressionList.eval(this.ctx);
			}
		})
	};
})(AST);
