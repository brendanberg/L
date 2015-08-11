var AST = require('../ast');
var dispatch = require('../dispatch');

(function(AST) {
	AST.Bool.prototype.ctx = {
		'==': dispatch({
			'Boolean': function(b) {
				return new AST.Bool(this.value === b.value);
			},
			'Bottom': function(b) {
				return new AST.Bool(false);
			}
		}),
		'/\\': dispatch({
			'Boolean': function(b) {
				return new AST.Bool(this.value && b.value);
			}
		}),
		'\\/': dispatch({
			'Boolean': function(b) {
				return new AST.Bool(this.value || b.value);
			}
		}),
		'!': dispatch({
			'': function() {
				return new AST.Bool(!this.value);
			}
		})
	};
})(AST);
