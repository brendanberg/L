var AST = require('../ast');
var dispatch = require('../dispatch');

function inspectify(depth, fmt) {
	return function(x) {
		return x.repr(depth, fmt);
	};
};

(function(AST) {
	module.exports = {
		Dictionary: {
			"('@':)": dispatch({
				'Integer': function(n) {
					return this.ctx[n.value] || new AST.Bottom();
				}
			})
		},
		List: {
 			"('@':)": dispatch({
				'Integer': function(n) {
					var index;
					if (n.value < 0) {
						index = this.list.length + n.value;
					} else {
						index = n.value;
					}
					return this.list[index] || new AST.Bottom();
				},
				'List': function(l) {
					var lookup = function(list, indexes) {
						if (list && 'list' in list) {
							if (indexes.length === 1) {
								return list.list[indexes[0]] || new AST.Bottom();
							} else {
								return lookup(list.list[indexes.splice(0, 1)[0]], indexes);
							}
						} else {
							return new AST.Bottom();
						}
					};
					return lookup(this, l.list.map(
						function(x){ return x.value; }
					));
				}
			}),
			'(join:)': dispatch({
				'String': function(s) {
					var str = this.list.map(function(x) { return x.value; }).join(s.value);
					return new AST.String({value: str});
				}
			}),
			'(filter:)': dispatch({
				'Function': function(fn) {
					var self = this;
					var filtered = [];
					for (var i = 0, len = this.list.length; i < len; i++) {
						var item = new AST.Invocation(fn, new AST.List(
							[this.list[i]], {source: 'parameterList'}
						));
						var test = item.eval(this);

						if (test.type === 'Tag' && 
								test.tags.type === 'Bool' && test.name === 'True') {
							filtered.push(this.list[i]);
						}
					}
					return new AST.List(filtered);
				},
				'Match': function(m) {
					}
			}),
			'(map:)': dispatch({
				'Function': function(fn) {
					var self = this;
					var filtered = [];
					for (var i = 0, len = this.list.length; i < len; i++) {
						var item = new AST.Invocation(fn, new AST.List(
							[this.list[i]], {source: 'parameterList'}
						));
						filtered.push(item.eval(this));
					}
					return new AST.List(filtered);
				},
				'Match': function(m) {
					var self = this;
					var filtered = [];
					for (var i = 0, len = this.list.length; i < len; i++) {
						var item = new AST.Invocation(m, new AST.List(
							[this.list[i]], {source: 'parameterList'}
						));
						filtered.push(item.eval(this));
					}
					return new AST.List(filtered);
				}
			}),
			'(reduce:)': dispatch({
				'Function': function(fn) {

				}
			}),
			"('+':)": dispatch({
				'List': function(list) {
					var items = this.list.slice();
					Array.prototype.push.apply(items, list.list);
					return new AST.List(items, {source: 'list'});
				}
			}),
			'(append:)': function(val) {
				var items = this.list.slice();
				items.push(val);
				return new AST.List(items, {source: 'list'});
			},
			'(length)': function() {
				return new AST.Integer(this.list.length);
			}
			// append(x), extend([L]), insert(i, x), remove(x), pop(i?),
			// index(x), count(x), length(), sort(...), reverse(),
			// filter((x)->{n}), map((x)->{n}), reduce((a, b)->{x})
		}
	};
})(AST);
