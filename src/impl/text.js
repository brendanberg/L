var AST = require('../ast');
var dispatch = require('../dispatch');

(function(AST) {
	module.exports = {
		Text: {
			"('+':)": dispatch({
				'Text': function(s) {
					return new AST.Text(this.value + s.value);
				}
			}),
			"('==':)": dispatch({
				'Text': function(s) {
					var exp = this.value === s.value;
					return new AST.Tag(exp ? 'True' : 'False', null, {type: 'Bool'});
				}
			}),
			'(characterAt:)': dispatch({
				'Integer': function(n) {
					var idx = n.value < 0 ? this.value.length + n.value : n.value;
					var char = this.value[idx];
					if (char) {
						return new AST.Text(char);
					} else {
						return new AST.Bottom();
					}
				}
			}),
			'(split:)': dispatch({
				'Text': function(s) {
					var ls = this.value.split(s.value);
					return new AST.List(
						ls.map(function(x) { return new AST.Text(x); })
					);
				}
			})
		}
	};
})(AST);
