const { Set, Map, List, Repeat, Seq } = require('immutable');
const Type = require('../ast/type');
const A = require('../arbor');
const dispatch = require('../dispatch');
const resolve = require('../resolve');
/*
const Text = require('../ast/text');
const Integer = require('../ast/integer');
const List_ = require('../ast/list');
const Bottom = require('../ast/bottom');
const dispatch = require('../dispatch');
*/
const Call = require('../ast/call');
const bool = function(exp) { return exp ? 'True' : 'False' };

let ListType = new Type({label: 'List', scope: Set([])});

ListType.methods = {
	'(count.)': function() {
		return A.pushScope(this.scope)(A.Integer(this.items.count()));
	},
	'(isEmpty.)': function() {
		const label = bool(this.items.isEmpty());
		return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
	},
	'(reverse.)': function() {
		return this.update('items', (items) => { return items.reverse().toList(); });
	},
	"('@':)": dispatch({
		'Integer': function(idx) {
			return this.items.get(idx.value) || A.Bottom();
		}
	}),
	"('+':)": dispatch({
		'List': function(s) {
			return this.update('items', (v) => v.concat(s.items));
		}
	}),
	"('*':)": dispatch({
		'Integer': function(n) {
			return this.update('items', (items) => {
				return List(Repeat(items, n.value)).flatten(1);
			});
		}
	}),
	'(contains:)': function(v) {
		const label = bool(this.items.includes(v));
		return A.pushScope(this.scope)(A.Symbol(label, 'Boolean'));
	},
	'(join:)': dispatch({
		// TODO: This should probably return a list?
		// Is [Text](join:Text)->Text a weird signature when other types
		// look more like this: [Integer](join:Integer)->[Integer]
		'Text': function(s) {
			let joinedChars = this.items.reduce((result, node) => {
				return result.concat([node.value]);
			}, []).reduce((result, chars) => {
				return result.concat(s.value).concat(chars);
			});

			return A.pushScope(this.scope)(A.Text(joinedChars));
		},
	}),
	'(append:)': function(v) {
		return this.set('items', this.items.push(v));
	},
	'(insert:at:)': function(val, idx) {
		return this.update('items', (items) => {
			return items.insert(idx.value, val);
		});
	},
	'(removeAt:)': dispatch({
		'Integer': function (idx) {
			return this.update('items', (items) => {
				return items.toList().remove(idx.value);
			});
		},
	}),
	'(zip:)': dispatch({
		'List': function(l) {
			return A.pushScope(this.scope)(this.update('items', (items) => {
				return items.zip(l.items).map((it) => A.List(...it));
			}));
		},
	}),
	'(zip:withFill:)': function(list, val) {
		let difference = this.items.count() - list.items.count();
		let left, right;

		if (difference < 0) {
			left = this.items.concat(Repeat(val, -difference));
			right = list.items;
		} else if (difference > 0) {
			left = this.items;
			right = list.items.concat(Repeat(val, difference));
		} else {
			left = this.items;
			right = list.items;
		}

		return A.pushScope(this.scope)(this.update('items', (items) => {
			return left.zip(right).map((it) => A.List(...it));
		}));
	},
	'(unzip.)': function() {
		let first = [], second = [];
		this.items.map((item) => {
			first.push(item.items.get(0));
			second.push(item.items.get(1));
		});

		return A.pushScope(this.scope)(A.List(A.List(...first), A.List(...second)));
	},
	'(enumerate.)': function() {
		// Shorthand for `values(zip: (0...))` ?
		return A.pushScope(this.scope)(this.update('items', (items) =>
			items.map((val, key) => A.List(A.Integer(key), val))));
	},
	'(split:)': function() {},
	'(split:max:)': function() {},
	'(compactSplit:max:)': function() {},

	// indexOf:
	// countOf:
	// partitionAt ??
	// [a, b, c, d](popElementAt: 1) #=> [b, [a, c, d]]
	// (any:)
	// (all:)
	// asText: ???
	// iter ???
	// (maxValue.) ?
	// (minValue.) ?

	// Sorts and comparisons

	'(partitionBy:)': dispatch({  // '(partitionOnCondition:)' ?
		'Function': function(fn) {
			let partition = this.items.reduce((result, item) => {
				let is_match = (new Call({
					target: fn,
					args: List([item])
				})).eval(this.ctx)[0];

				if (is_match.label === 'True') {
					result[0].push(item);
				} else {
					result[1].push(item);
				}

				return result;
			}, [[], []]);

			return new List_({items: List([
				new List_({items: List(partition[0])}),
				new List_({items: List(partition[1])})
			])});
		},
		'HybridFunction': function(fn) {

		},
	}),
	'(sort.)': function() {
		return this.update('items', (items) => {
			return items.sort((a, b) => {
				// Call a('<': b)
				let typeBinding = a.getIn(['tags', 'typebinding']);
				let lt_method = this.ctx.get(typeBinding).methodForSelector("('<':)");
				let lt_result = lt_method.apply(a, [b]);
				let less = (lt_result._name == 'Symbol' && lt_result.label == 'True');

				// Call a('>': b)
				let gt_method = this.ctx.get(typeBinding).methodForSelector("('>':)");
				let gt_result = gt_method.apply(a, [b]);
				let greater = (gt_result._name == 'Symbol' && gt_result.label == 'True');
				
				if (!less && !greater) { return 0; }
				else if (less) { return -1; }
				else if (greater) { return 1; }
			});
		});
	},
	'(sortWith:)': dispatch({  // '(sortUsing:)' ?
		'Function': function(fn) {
			return this.update('items', (items) => {
				return items.sort((a, b) => {
					let result =  (new Call({
						target: fn,
						args: List([a, b])
					})).eval(this.ctx)[0];
					if (result.label == 'Same') { return 0; }
					else if (result.label == 'Ascending') { return -1; }
					else if (result.label == 'Descending') { return 1; }
				});
			});
		},
		'HybridFunction': function(fn) {
			return this.update('items', (items) => {
				return items.sort((a, b) => {
					let result =  (new Call({
						target: fn,
						args: List([a, b])
					})).eval(this.ctx)[0];
					if (result.label == 'Same') { return 0; }
					else if (result.label == 'Ascending') { return -1; }
					else if (result.label == 'Descending') { return 1; }
				});
			});
		},
	}),
	'(sortWithMapper:using:)': function(mapper, comparison) {

	},
	'(sortMapped:with:)': function(mapper, comparator) {
		// Mapper is a function that takes an item from the list
		// and returns the value that should be compared
		//
		// Comparator is a function that compares two elements
		// and returns .Same if the elements should not be swapped,
		// .Ascending if a comes before b, and .Descending if
		// a comes after b.
		/*this.update('items', this.items.map((item) => {
			return (new Call({
				target: mapper,
				args: new List_({items: List([item])})
			})).eval(mapper.ctx);
		});*/
	},


	// General higher-order methods

	"('=>':)": dispatch({
		'Function': function(f) {
			// nested => (sublist) -> { sublist => (x) -> { x } }
			//                          ^---------------------^
			//
			// nested => (sublist) -> { [ sublist => (x) -> { x } ] }
			//                          ^-------------------------^
			//
			// Note that the => operator takes a sequence and maps a function
			// over its items. If the result of the map is a scalar, it appends
			// the scalar to the result. If the result of the map is a list or
			// sequence, it concats the sequence to the end of the result.

			return this.update('items', (items) => {
				return items.reduce((result, item) => {
					let value = (new Call({
						target: f, args: List([item])
					})).eval(this.ctx)[0];

					if (value && value._name === 'List') {
						return result.concat(value.items.filter((item) => {
							return item && item._name !== 'Bottom';
						}));
					} else if (value && value._name !== 'Bottom') {
						return result.push(value);
					} else {
						return result;
					}
				}, List([]));
			});
		},
		'HybridFunction': function (f) {
			return this.update('items', (items) => {
				return items.reduce((result, item) => {
					let value = (new Call({
						target: f, args: List([item])
					})).eval(this.ctx);

					if (value && value._name === 'List') {
						return result.concat(value.items.filter((item) => {
							return item && item._name !== 'Bottom';
						}));
					} else if (value && value._name !== 'Bottom') {
						return result.push(value);
					} else {
						return result;
					}
				}, List([]));
			});
		},
	}),
	'(map:)': dispatch({
		// fns(map: (fn) -> { fn(elt) })
		// fns(map: { _0(elt)) })
		'Function': function(f) {
			return A.pushScope(this.scope)(
				this.set('items', this.items.map((item) => A.Call(f, [item])))
			);
		},
		'HybridFunction': function(m) {
			return A.pushScope(this.scope)(
				this.set('items', this.items.map((item) => A.Call(m, [item])))
			);
		},
	}),
	'(compactMap:)': dispatch({
		'Function': function(f) {
			// TODO: Refactor to remove the call to resolve
			const ctx = this.ctx;
			return this.update('items', (items) => {
				return items.map((item) => {
					const ast = A.pushScope(item.scope)(A.Call(f, [item]));
					let ret = resolve(ast, ctx.getBindings())[0];
					return ret.eval(ctx)[0];
				}).filter((item) => item && item._name !== 'Bottom');
			});
		},
		'HybridFunction': function (f) {
			const ctx = this.ctx;
			return this.update('items', (items) => {
				return items.map((item) => {
					const ast = A.pushScope(item.scope)(A.Call(f, [item]));
					const newItem = resolve(ast, ctx.getBindings())[0];
					return newItem.eval(ctx)[0];
				}).filter((item) => item && item._name !== 'Bottom');
			});
		},
	}),
	'(filter:)': dispatch({
		'Function': function(f) {
			return this.set('items', this.items.filter((item) => {
				let [ret, __] = (new Call({
					target: f,
					args: List([item])
				})).eval(this.ctx);

				return ret.label === 'True';
			}));
		},
		'HybridFunction': function(m) {
			return this.set('items', this.items.filter((item) => {
				let [ret, __] = (new Call({
					target: m,
					args: List([item])
				})).eval(this.ctx);

				return ret.label === 'True';
			}));
		},
	}),
	'(reduce:)': dispatch({
		'Function': function(f) {
			return this.items.reduce((init, item) => {
				return (new Call({
					target: f,
					args: List([init, item])
				})).eval(this.ctx)[0];
			});
		},
		'HybridFunction': function(m) {
			return this.items.reduce((init, item) => {
				return (new Call({
					target: m,
					args: List([init, item])
				})).eval(this.ctx)[0];
			});
		},
	}),
	'(reduceInto:with:)': function(init, func) {  // '(reduceInto:using:)' ?
		return this.items.reduce((init, item) => {
			return (new Call({
				target: func,
				args: List([init, item])
			})).eval(this.ctx)[0];
		}, init);
	},
};

module.exports = ListType;
