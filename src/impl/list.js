const { Map, List: IList } = require('immutable');
const Type = require('../ast/type');
const Variant = require('../ast/variant');
const Text = require('../ast/text');
const Integer = require('../ast/integer');
const List = require('../ast/list');
const Bottom = require('../ast/bottom');
const FunctionCall = require('../ast/functioncall');
const dispatch = require('../dispatch');

function make_bool(exp) {
	return new Variant({label: exp ? 'True' : 'False', tags: Map({type: 'Boolean'})});
}

let _List = new Type({label: 'List'});

_List.methods = {
	'(.count)': function() {
		return new Integer({value: this.items.count()});
	},
	"('@':)": dispatch({
		'Integer': function(idx) {
			return this.items.get(idx.value) || new Bottom();
		}
	}),
	"('+':)": dispatch({
		'List': function(s) {
			return this.update('items', function(v) { return v.concat(s.items); });
		}
	}),
	'(join:)': dispatch({
		'Text': function(s) {
			let joinedChars = this.items.reduce(function(result, node) {
				return result.concat([node.value]);
			}, []).reduce(function(result, chars) {
				return result.concat(s.value).concat(chars);
			});

			return new Text({value: joinedChars});
		}
	}),
	'(append:)': function(v) {
		return this.set('items', this.items.push(v));
	},
	'(map:)': dispatch({
		'Function': function(f) {
			return this.set('items', this.items.map(function(item) {
				return (new FunctionCall({
					target: f,
					args: new List({items: IList([item])})
				})).eval(f.ctx);
			}));
		},
		'Match': function(m) {
			return this.set('items', this.items.map(function(item) {
				return (new FunctionCall({
					target: m,
					args: new List({items: IList([item])})
				})).eval(m.ctx);
			}));
		},
	}),
	'(compactMap:)': dispatch({
		'Function': function(f) {
			return this.set('items', this.items.map(function(item) {
				return (new FunctionCall({
					target: f, args: new List({items: IList([item])})
				})).eval(f.ctx);
			}).filter(function(item) { return item && item._name !== 'Bottom'; }));
		},
		'Match': function (f) {
			return this.set('items', this.items.map(function(item) {
				return (new FunctionCall({
					target: f, args: new List({items: IList([item])})
				})).eval(f.ctx);
			}).filter(function(item) { return item && item._name !== 'Bottom'; }));
		},
	}),
	'(filter:)': dispatch({
		'Function': function(f) {
			return this.set('items', this.items.filter(function(item) {
				return (new FunctionCall({
					target: f,
					args: new List({items: IList([item])})
				})).eval(f.ctx).label === 'True';
			}));
		},
		'Match': function(m) {
			return this.set('items', this.items.filter(function(item) {
				return (new FunctionCall({
					target: m,
					args: new List({items: IList([item])})
				})).eval(m.ctx).label === 'True';
			}));
		},
	}),
	'(reduce:)': dispatch({
		'Function': function(f) {
			return this.items.reduce(function(init, item) {
				return (new FunctionCall({
					target: f,
					args: new List({items: IList([init, item])})
				})).eval(f.ctx);
			});
		},
		'Match': function(m) {
			return this.items.reduce(function(init, item) {
				return (new FunctionCall({
					target: m,
					args: new List({items: IList([init, item])})
				})).eval(m.ctx);
			});
		},
	}),
	'(reduceInto:with:)': function(init, func) {
		return this.items.reduce(function(init, item) {
			return (new FunctionCall({
				target: func,
				args: new List({items: IList([init, item])})
			})).eval(func.ctx);
		}, init);
	},
};

module.exports = _List;
