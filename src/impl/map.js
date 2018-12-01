const { Set, Map, List } = require('immutable');
const Type = require('../ast/type');
const Symbol = require('../ast/symbol');
const Text = require('../ast/text');
const Integer = require('../ast/integer');
const List_ = require('../ast/list');
const KeyValuePair = require('../ast/keyvaluepair');
const Bottom = require('../ast/bottom');
const Call = require('../ast/call');
const A = require('../arbor');
const dispatch = require('../dispatch');


function make_bool(exp) {
	return new Symbol({
		label: exp ? 'True' : 'False',
		scope: Set([]),
		tags: Map({type: 'Boolean'})
	});
}

let _Map = new Type({label: 'Map', scope: Set([])});

_Map.methods = {
	'(count.)': function() {
		return A.Integer(this.items.count());
	},
	'(isEmpty.)': function() {
		return make_bool(this.items.isEmpty());
	},
	"('@':)": function(key) {
		let item = this.items.get(key);
		return item ? item.val : A.Bottom();
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
				return (new Call({
					target: f,
					args: List([item])
				})).eval(f.ctx)[0];
			}));
		},
		'Match': function(m) {
			return this.set('items', this.items.map((item) => {
				return (new Call({
					target: m,
					args: List([item])
				})).eval(m.ctx)[0];
			}));
		},
	}),
	'(filter:)': dispatch({
		'Function': function(f) {
			return this.set('items', this.items.filter((item) => {
				return (new Call({
					target: f,
					args: List([item])
				})).eval(f.ctx)[0].label === 'True';
			}));
		},
		'Match': function(m) {
			return this.set('items', this.items.filter((item) => {
				return (new Call({
					target: m,
					args: List([item])
				})).eval(m.ctx)[0].label === 'True';
			}));
		},
	}),
	'(compactMap:)': dispatch({
		'Function': function(f) {
			return this.set('items', this.items.map((item) => {
				return (new Call({
					target: f, args: List([item])
				})).eval(f.ctx)[0];
			}).filter((item) => { return item && item._name !== 'Bottom'; }));
		},
		'Match': function (f) {
			return this.set('items', this.items.map((item) =>{
				return (new Call({
					target: f, args: List([item])
				})).eval(f.ctx)[0];
			}).filter((item) => { return item && item._name !== 'Bottom'; }));
		},
	}),
	'(reduce:)': dispatch({
		'Function': function(f) {
			return this.items.reduce((init, item) => {
				return (new Call({
					target: f,
					args: List([init, item])
				})).eval(f.ctx)[0];
			});
		},
		'Match': function(m) {
			return this.items.reduce((init, item) => {
				return (new Call({
					target: m,
					args: List([init, item])
				})).eval(m.ctx)[0];
			});
		},
	}),
	'(reduceInto:with:)': function(init, func) {
		return this.items.reduce((init, item) => {
			return (new Call({
				target: func,
				args: List([init, item])
			})).eval(func.ctx)[0];
		}, init);
	},
};

module.exports = _Map;
