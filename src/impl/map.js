const { Map, List } = require('immutable');
const Type = require('../ast/type');
const Symbol = require('../ast/symbol');
const Text = require('../ast/text');
const Integer = require('../ast/integer');
const List_ = require('../ast/list');
const KeyValuePair = require('../ast/keyvaluepair');
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

let _Map = new Type({label: 'Map'});

_Map.methods = {
	'(count.)': function() {
		return new Integer({value: this.items.count()});
	},
	'(isEmpty.)': function() {
		return make_bool(this.items.isEmpty());
	},
	"('@':)": function(key) {
		let item = this.items.get(key);
		return item ? item.val : new Bottom();
	},
	"('+':)": dispatch({
		// This is a dictionary merge.
		'Map': function(s) {
			return this.update('items', (v) => { return v.merge(s.items); });
		}
	}),
	'(contains:)': function(v) {
		return make_bool(this.items.includes(v));
	},
	'(items.)': function() {},
	'(keys.)': function() {},
	'(values.)': function() {},
	'(merge:usingMerger:)': function() {},
	'(setKey:value:)': function(k, v) {
		return this.set('items', this.items.set(k, new KeyValuePair({
			key: k, val: v
		})));
	},
	'(updateKey:updater:)': function(k, func) {

	},
	"('=>':)": dispatch({

	}),
	'(map:)': dispatch({
		'Function': function(f) {
			return this.set('items', this.items.map((item) => {
				return (new Invocation({
					target: f,
					args: List([item])
				})).eval(f.ctx);
			}));
		},
		'Match': function(m) {
			return this.set('items', this.items.map((item) => {
				return (new Invocation({
					target: m,
					args: List([item])
				})).eval(m.ctx);
			}));
		},
	}),
	'(filter:)': dispatch({
		'Function': function(f) {
			return this.set('items', this.items.filter((item) => {
				return (new Invocation({
					target: f,
					args: List([item])
				})).eval(f.ctx).label === 'True';
			}));
		},
		'Match': function(m) {
			return this.set('items', this.items.filter((item) => {
				return (new Invocation({
					target: m,
					args: List([item])
				})).eval(m.ctx).label === 'True';
			}));
		},
	}),
	'(compactMap:)': dispatch({
		'Function': function(f) {
			return this.set('items', this.items.map((item) => {
				return (new Invocation({
					target: f, args: List([item])
				})).eval(f.ctx);
			}).filter((item) => { return item && item._name !== 'Bottom'; }));
		},
		'Match': function (f) {
			return this.set('items', this.items.map((item) =>{
				return (new Invocation({
					target: f, args: List([item])
				})).eval(f.ctx);
			}).filter((item) => { return item && item._name !== 'Bottom'; }));
		},
	}),
	'(reduce:)': dispatch({
		'Function': function(f) {
			return this.items.reduce((init, item) => {
				return (new Invocation({
					target: f,
					args: List([init, item])
				})).eval(f.ctx);
			});
		},
		'Match': function(m) {
			return this.items.reduce((init, item) => {
				return (new Invocation({
					target: m,
					args: List([init, item])
				})).eval(m.ctx);
			});
		},
	}),
	'(reduceInto:with:)': function(init, func) {
		return this.items.reduce((init, item) => {
			return (new Invocation({
				target: func,
				args: List([init, item])
			})).eval(func.ctx);
		}, init);
	},
};

module.exports = _Map;
