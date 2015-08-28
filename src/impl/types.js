var AST = require('../ast');
var dispatch = require('../dispatch');

(function(AST) {
	AST.Struct.prototype.ctx = {
		"('|':)": dispatch({
			'Struct': function(t) {
				return new AST.Option([this, t]);
			},
			'Option': function(o) {
				var variants = o.variants
				variants.unshift(this);
				return new AST.Option(variants);
			},
			'Bottom': function(_) {
				return new AST.Option([this, _]);
			}
		})
	};
})(AST);
