var AST = require('../ast');
var dispatch = require('../dispatch');

(function(AST) {
	AST.String.prototype.ctx = {
		"('+':)": dispatch({
			'String': function(s) {
				return new AST.String(this.value + s.value);
			}
		}),
		"('==':)": dispatch({
			'String': function(s) {
				var exp = this.value === s.value;
				return new AST.Tag(exp ? 'True' : 'False', null, {type: 'Bool'});
			}
		}),
		'(characterAt:)': dispatch({
			'Integer': function(n) {
				var idx = n.value < 0 ? this.value.length + n.value : n.value;
				var char = this.value[idx];
				if (char) {
					return new AST.String(char);
				} else {
					return new AST.Bottom();
				}
			}
		}),
		'(split:)': dispatch({
			'String': function(s) {
				var ls = this.value.split(s.value);
				return new AST.List(
					ls.map(function(x) { return new AST.String(x); })
				);
			}
		})
	};
})(AST);
