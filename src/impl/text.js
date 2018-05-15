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
			// TODO: Normalize before comparison
			let equal = this.value.reduce(function(value, ch, idx) {
				return value && (ch === s.value[idx]); 
			}, true);
			return make_bool(equal);
		}
	}),
	"('!=':)": dispatch({
		'Text': function(s) {
			// TODO: Normalize before comparison
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
			// TODO: This is a naive implementation. Replace with a more
			// efficient algorithm like Boyer-Moore:
			// https://en.wikipedia.org/wiki/Boyer–Moore_string_search_algorithm
			let items;

			if (s.value.length === 0) {
				// The trivial split
				items = this.value.reduce(function(result, item) {
					return result.push(new Text({value: [item]}));
				}, IList([]));

				return new List({items: items});
			}

			let splits = this.value.reduce(function(result, item) {
				let res;

				if (result[2].count() === 0 && item === s.value[0]) {
					// Ended a match and started a new one
					return [result[0].push(IList([])), IList([item]), IList(s.value).rest()];
				} else if (result[2].count() === 0) {
					// Ended a match
					return [result[0].push(IList([item])), IList([]), IList(s.value)];
				} else if (result[2].get(0) === item) {
					// Starting or continuing a match
					return [result[0], result[1].push(item), result[2].slice(1)];
				} else if (result[2].count() < s.value.length) {
					// Reset after a false start
					res = result[0].update(-1, function(v) {
						return v.concat(result[1]).push(item);
					});
					return [res, IList([]), IList(s.value)];
				} else {
					// Continue outside a match
					res = result[0].update(-1, function(v) {
						return v.push(item);
					});
					return [res, result[1], result[2]];
				}
			}, [IList([IList([])]), IList([]), IList(s.value)]);

			let texts = splits[0].map(function(item) {
				return new Text({value: item.toArray()});
			});

			if (splits[2].count() === 0) {
				return new List({items: texts.push(new Text({value: []}))});
			} else if (splits[2].count() < s.value.length) {
				let fixed = texts.update(-1, function(t) {
					return t.update('value', function(v) {
						return v.concat(splits[1].toArray());
					});
				});
				return new List({items: fixed});
			} else {
				return new List({items: texts});
			};
		}
	}),
};

module.exports = _Text;
