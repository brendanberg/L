const { Map, List: IList } = require('immutable');
const Variant = require('../ast/variant');
const Text = require('../ast/text');
const Integer = require('../ast/integer');
const List = require('../ast/list');
const Bottom = require('../ast/bottom');
const dispatch = require('../dispatch');

function make_bool(exp) {
	return new Variant({label: exp ? 'True' : 'False', tags: Map({type: 'Bool'})});
}

module.exports = Map({
	'(.count)': function() {
		return new Integer({value: this.items.count()});
	},
	'(itemAtIndex:)': dispatch({
		'Integer': function(idx) {
			return this.items.get(idx.value) || new Bottom();
		}
	}),
	"('+':)": dispatch({
		'List': function(s) {
			return this.update('items', function(v) { return v.concat(s.items); });
		}
	}),
/*	"('==':)": dispatch({
		'Text': function(s) {
			return make_bool(this.value === s.value);
		}
	}),
	"('!=':)": dispatch({
		'Text': function(s) {
			return make_bool(this.value != s.value);
		}
	}),*/
/*	'(characterAt:)': dispatch({
		'Integer': function(n) {
			let idx = n.value < 0 ? this.value.length + n.value : n.value;
			let ch = this.value[idx];
			return ch ? new Text({value: ch}) : new Bottom();
		}
	}),*/
	'(join:)': dispatch({
		'Text': function(s) {
			return new Text({value: this.items.map(function(node) {
				return node.value;
			}).toArray().join(s.value)});
		}
	}),
});

