const { Map, List, Repeat, Seq } = require('immutable');
const Type = require('../ast/type');
const Symbol = require('../ast/symbol');
const Text = require('../ast/text');
const Integer = require('../ast/integer');
const List_ = require('../ast/list');
const Bottom = require('../ast/bottom');
const Invocation = require('../ast/invocation');
const dispatch = require('../dispatch');

function make_bool(exp) {
	return new Symbol({
		label: exp ? 'True' : 'False',
		scope: Set([]),
		tags: Map({type: 'Boolean'})
	});
}

let ListType = new Type({label: 'List'});

ListType.methods = {
	'(count.)': function() {
		return new Integer({value: this.items.count()});
	},
	'(isEmpty.)': function() {
		return make_bool(this.items.isEmpty());
	},
	'(reverse.)': function() {
		return this.update('items', (items) => { return items.reverse().toList(); });
	},
	"('@':)": dispatch({
		'Integer': function(idx) {
			return this.items.get(idx.value) || new Bottom();
		}
	}),
	"('+':)": dispatch({
		'List': function(s) {
			return this.update('items', (v) => { return v.concat(s.items); });
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
		return make_bool(this.items.includes(v));
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

			return new Text({value: joinedChars});
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
			return this.update('items', (items) => {
				return items.zip(l.items).map((it) => {
					return new List_({items: List(it)})
				});
			});
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

		return this.update('items', (items) => {
			return left.zip(right).map((it) => { return new List_({items: it}) });
		});
	},
	'(unzip.)': function() {
		let first = [], second = [];
		this.items.map((item) => {
			first.push(item.items.get(0));
			second.push(item.items.get(1));
		});

		return new List_({items: List([
			new List_({items: List(first)}),
			new List_({items: List(second)})
		])});
	},
	'(enumerate.)': function() {
		// Shorthand for `values(zip: (0...))` ?
		return this.update('items', (items) => {
			return items.map((val, key) => {
				let idx = new Integer({value: key, tags: Map({'source_base': 10})});
				return new List_({items: List([idx, val])});
			});
		});
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
				let is_match = (new Invocation({
					target: fn,
					args: List([item])
				})).eval(this.ctx);

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
				// Invoke a('<': b)
				let alabel = {label: a._name, scopes: Set([])};
				let lt_method = this.ctx.get(alabel).methodForSelector("('<':)");
				//lookup(a._name).methodForSelector("('<':)");
				let lt_result = lt_method.apply(a, [b]);
				let less = (lt_result._name == 'Symbol' && lt_result.label == 'True');

				// Invoke a('>': b)
				let gt_method = this.ctx.get(alabel).methodForSelector("('>':)");
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
					let result =  (new Invocation({
						target: fn,
						args: List([a, b])
					})).eval(this.ctx);
					if (result.label == 'Same') { return 0; }
					else if (result.label == 'Ascending') { return -1; }
					else if (result.label == 'Descending') { return 1; }
				});
			});
		},
		'HybridFunction': function(fn) {
			return this.update('items', (items) => {
				return items.sort((a, b) => {
					let result =  (new Invocation({
						target: fn,
						args: List([a, b])
					})).eval(this.ctx);
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
			return (new Invocation({
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
					let value = (new Invocation({
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
		'HybridFunction': function (f) {
			return this.update('items', (items) => {
				return items.reduce((result, item) => {
					let value = (new Invocation({
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
			return this.set('items', this.items.map((item) => {
				return (new Invocation({
					target: f,
					args: List([item])
				})).eval(this.ctx);
			}));
		},
		'HybridFunction': function(m) {
			return this.set('items', this.items.map((item) => {
				return (new Invocation({
					target: m,
					args: List([item])
				})).eval(this.ctx);
			}));
		},
	}),
	'(compactMap:)': dispatch({
		'Function': function(f) {
			return this.set('items', this.items.map((item) => {
				return (new Invocation({
					target: f, args: List([item])
				})).eval(this.ctx);
			}).filter((item) => { return item && item._name !== 'Bottom'; }));
		},
		'HybridFunction': function (f) {
			return this.set('items', this.items.map((item) => {
				return (new Invocation({
					target: f, args: List([item])
				})).eval(this.ctx);
			}).filter((item) => { return item && item._name !== 'Bottom'; }));
		},
	}),
	'(filter:)': dispatch({
		'Function': function(f) {
			return this.set('items', this.items.filter((item) => {
				return (new Invocation({
					target: f,
					args: List([item])
				})).eval(this.ctx).label === 'True';
			}));
		},
		'HybridFunction': function(m) {
			return this.set('items', this.items.filter((item) => {
				return (new Invocation({
					target: m,
					args: List([item])
				})).eval(this.ctx).label === 'True';
			}));
		},
	}),
	'(reduce:)': dispatch({
		'Function': function(f) {
			return this.items.reduce((init, item) => {
				return (new Invocation({
					target: f,
					args: List([init, item])
				})).eval(this.ctx);
			});
		},
		'HybridFunction': function(m) {
			return this.items.reduce((init, item) => {
				return (new Invocation({
					target: m,
					args: List([init, item])
				})).eval(this.ctx);
			});
		},
	}),
	'(reduceInto:with:)': function(init, func) {  // '(reduceInto:using:)' ?
		return this.items.reduce((init, item) => {
			return (new Invocation({
				target: func,
				args: List([init, item])
			})).eval(this.ctx);
		}, init);
	},
};

module.exports = ListType;
