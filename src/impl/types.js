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
		}),
		"(selectors:)": function() {
			var selectors = [];
			for (var i in this.ctx) {
				if (i.match(/^\(.*\)$/)) {
					selectors.push(new AST.String(i));
				}
			}
			return new AST.List(selectors, {source: 'list'});
			
		}
	};
})(AST);
