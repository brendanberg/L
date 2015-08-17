var AST = require('../ast');
var dispatch = require('../dispatch');

(function(AST) {
	AST.String.prototype.ctx = {
		'+': dispatch({
			'String': function(s) {
				return new AST.String(this.value + s.value);
			}
		}),
		'==': dispatch({
			'String': function(s) {
				return new AST.Bool(this.value === s.value);
			}
		})
	};
})(AST);
