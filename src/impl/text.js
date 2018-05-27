const { Map, List } = require('immutable');
const punycode = require('punycode');
const Type = require('../ast/type');
const Symbol = require('../ast/symbol');
const Text = require('../ast/text');
const Integer = require('../ast/integer');
const List_ = require('../ast/list');
const Bottom = require('../ast/bottom');
const dispatch = require('../dispatch');


function make_bool(exp) {
	return new Symbol({label: exp ? 'True' : 'False', tags: Map({type: 'Boolean'})});
}


let TextType = new Type({label: 'Text'});

TextType.methods = {
	'(count.)': function() {
		return new Integer({value: this.value.count()});
	},
	"('+':)": dispatch({
		'Text': function(s) {
			return this.update('value', function(v) { return v.concat(s.value); });
		}
	}),
	"('==':)": dispatch({
		'Text': function(s) {
			// TODO: Normalize before comparison
			// https://github.com/walling/unorm
			/*let equal = (this.value.count() == s.value.count())
						&& this.value.reduce((value, ch, idx) => {
				return value && (ch === s.value.get(idx)); 
			}, true);*/
			return make_bool(this.value.equals(s.value));
		}
	}),
	"('!=':)": dispatch({
		'Text': function(s) {
			// TODO: Normalize before comparison
			// https://github.com/walling/unorm
			/*let equal = (this.value.count() == s.value.count())
						&& this.value.reduce(function(value, ch, idx) {
				return value && (ch === s.value[idx]); 
			}, true);*/
			return make_bool(!this.value.equals(s.value));
		}
	}),
	"('<':)": dispatch({
		'Text': function(txt) {
			let comp = List(this.value).zip(txt.value).reduce((comparison, chars) => {
				if (comparison !== 0) { return comparison; }
				return Math.sign(chars.get(0) - chars.get(1));
			}, 0);

			return make_bool((comp === 0) ? (this.value.count() < txt.value.count()) : (comp < 0));
		},
	}),
	"('>':)": dispatch({
		'Text': function(txt) {
			let comp = List(this.value).zip(txt.value).reduce((comparison, chars) => {
				if (comparison !== 0) { return comparison; }
				return Math.sign(chars[0] - chars[1]);
			}, 0);

			return make_bool((comp === 0) ? (this.value.count() > txt.value.count()) : (comp > 0));
		}
	}),
	"('@':)": dispatch({
		'Integer': function(n) {
			let idx = n.value < 0 ? this.value.count() + n.value : n.value;
			let ch = this.value[idx];
			return ch ? new Text({value: [ch]}) : new Bottom();
		}
	}),
	/*'(contains:)': dispatch({
		'Text': function(txt) {
			List(this.value).contains(
		},	
	}),*/
	'(split:)': dispatch({
		'Text': function(s) {
			// TODO: This is a naive implementation. Replace with a more
			// efficient algorithm like Boyer-Moore:
			// https://en.wikipedia.org/wiki/Boyer–Moore_string_search_algorithm
			let items;

			if (s.value.count() === 0) {
				// The trivial split
				items = this.value.reduce(function(result, item) {
					return result.append(new Text({value: [item]}));
				}, List([]));

				return new List_({items: items});
			}

			let splits = this.value.reduce(function(result, item) {
				let res;

				if (result[2].count() === 0 && item === s.value[0]) {
					// Ended a match and started a new one
					return [result[0].append(List([])), List([item]), List(s.value).rest()];
				} else if (result[2].count() === 0) {
					// Ended a match
					return [result[0].append(List([item])), List([]), List(s.value)];
				} else if (result[2].get(0) === item) {
					// Starting or continuing a match
					return [result[0], result[1].append(item), result[2].slice(1)];
				} else if (result[2].count() < s.value.count()) {
					// Reset after a false start
					res = result[0].update(-1, function(v) {
						return v.concat(result[1]).append(item);
					});
					return [res, List([]), List(s.value)];
				} else {
					// Continue outside a match
					res = result[0].update(-1, function(v) {
						return v.append(item);
					});
					return [res, result[1], result[2]];
				}
			}, [List([List([])]), List([]), List(s.value)]);

			let texts = splits[0].map(function(item) {
				return new Text({value: item});
			});

			if (splits[2].count() === 0) {
				return new List_({items: texts.append(new Text({value: List([])}))});
			} else if (splits[2].count() < s.value.count()) {
				let fixed = texts.update(-1, function(t) {
					return t.update('value', function(v) {
						return v.concat(splits.get(1));
					});
				});
				return new List_({items: fixed});
			} else {
				return new List_({items: texts});
			};
		}
	}),
	'(compactSplit:)': dispatch({
		'Text': function(s) {},
	}),
	/*
	'(contains:)'
	'(rangeOfText:)'
	'(indexOfCharacterFrom:)'
	'(compare:)'
	'(compare:options:range:)'
	*/
};

module.exports = TextType;
