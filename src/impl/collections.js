var AST = require('../ast');
var dispatch = require('../dispatch');

function inspectify(depth, fmt) {
	return function(x) {
		return x.repr(depth, fmt);
	};
};

(function(AST) {
/*	AST.Dictionary.prototype.ctx = {
		'?': dispatch({
			'': function() {
				var self = this;
				// ?[k:T : v:T'] : (T)->T' => (ka:Ta, kb:Tb, ... kn:Tn) -> { v }
				// return a function that takes (a) one argument if the keys
				// in the dictionary are scalar, or (b) n arguments where n is
				// the lenth of list keys in the dictionary and returns the
				// evaluation of the value associated with the matched key

				// Matching: if it's a value, match the value. if it's an
				// [ 0: 1, n: if (n % 2 == 0) { n * n }, _: -1 ]
				// 
				// (a) -> {
				//   if (a == 0) {
				//     1
				//   } else {
				//     let n = a in { n * n }
				//   }
				// }
				var func = new AST.Function();
				func.plist = new AST.List([], {source: 'parameterList'});
				func.block = {
					expressionList: {
						eval: function(ctx) {
							// Switch on the argument types & return
							// the correct block
							return new AST.String('HELLO WORLD');
						}
					},
					toString: function() {
						return '<<< VIRTUAL BLOCK >>>';
					},
					repr: function(depth, fmt) {
						return fmt.stylize('<<< VIRTUAL BLOCK >>>', 'error');
					}
				};
				func.toString = function() {
					return '?' + self.toString();
				};
				func.repr = function(depth, fmt) {
					return (
						fmt.stylize('(', 'delimiter') +
						self.kvl.map(inspectify(depth, fmt)).join(
							fmt.stylize(', ', 'delimiter')
						) +
						fmt.stylize(')', 'delimiter')
					);
				};

				return func;
			}
		})
	};
*/
	AST.List.prototype.ctx = {
		// append(x), extend([L]), insert(i, x), remove(x), pop(i?),
		// index(x), count(x), length(), sort(...), reverse(),
		// filter((x)->{n}), map((x)->{n}), reduce((a, b)->{x})
	};
})(AST);
