const { Map, List: IList } = require('immutable');
const punycode = require('punycode');
const Type = require('../ast/type');
const Variant = require('../ast/variant');
const Text = require('../ast/text');
const Integer = require('../ast/integer');
const List = require('../ast/list');
const Bottom = require('../ast/bottom');
const dispatch = require('../dispatch');


function make_bool(exp) {
	return new Variant({label: exp ? 'True' : 'False', tags: Map({type: 'Boolean'})});
}

let _Text = new Type({label: 'Text'});

_Text.methods = {
	'(.count)': function() {
		return new Integer({value: this.value.length});
	},
	"('+':)": dispatch({
		'Text': function(s) {
			return this.update('value', function(v) { return v.concat(s.value); });
		}
	}),
	"('==':)": dispatch({
		'Text': function(s) {
			let equal = this.value.reduce(function(value, ch, idx) {
				return value && (ch === s.value[idx]); 
			}, true);
			return make_bool(equal);
		}
	}),
	"('!=':)": dispatch({
		'Text': function(s) {
			let equal = this.value.reduce(function(value, ch, idx) {
				return value && (ch === s.value[idx]); 
			}, true);
			return make_bool(!equal);
		}
	}),
	"('@':)": dispatch({
		'Integer': function(n) {
			let idx = n.value < 0 ? this.value.length + n.value : n.value;
			let ch = this.value[idx];
			return ch ? new Text({value: [ch]}) : new Bottom();
		}
	}),
	'(split:)': dispatch({
		'Text': function(s) {
		//TODO
			let ls = this.value.split(s.value);
			return new List({
				items: IList(ls.map(function(x) {
					return new Text({value: x});
				}))
			});
		}
	}),
};

module.exports = _Text;
