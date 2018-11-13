const { Map, List, Set } = require('immutable');
const punycode = require('punycode');
const Type = require('../ast/type');
const Symbol = require('../ast/symbol');
const Text = require('../ast/text');
const Integer = require('../ast/integer');
const List_ = require('../ast/list');
const Bottom = require('../ast/bottom');
const dispatch = require('../dispatch');


function make_bool(exp) {
	return new Symbol({
		label: exp ? 'True' : 'False',
		scope: Set([]),
		tags: Map({type: 'Boolean'})
	});
}


let TextType = new Type({label: 'Text', scope: Set([])});

TextType.methods = {
	'(count.)': function() {
		return new Integer({value: this.value.count(), scope: this.scope});
	},
	"('+':)": dispatch({
		'Text': function(s) {
			return this.update('value', (v) => { return v.concat(s.value); });
		}
	}),
	"('==':)": dispatch({
		'Text': function(s) {
			// TODO: Normalize before comparison
			// https://github.com/walling/unorm
			return make_bool(this.value.equals(s.value));
		}
	}),
	"('!=':)": dispatch({
		'Text': function(s) {
			// TODO: Normalize before comparison
			// https://github.com/walling/unorm
			return make_bool(!this.value.equals(s.value));
		}
	}),
	"('<':)": dispatch({
		'Text': function(txt) {
			let comp = List(this.value).zip(txt.value).reduce((comparison, chars) => {
				// chars is the tuple [lhs[i], rhs[i]] at position i
				if (comparison !== 0) { return comparison; }
				return Math.sign(chars[0] - chars[1]);
			}, 0);

			return make_bool((comp === 0) ? (this.value.count() < txt.value.count()) : (comp < 0));
		},
	}),
	"('>':)": dispatch({
		'Text': function(txt) {
			let comp = List(this.value).zip(txt.value).reduce((comparison, chars) => {
				// chars is the tuple [lhs[i], rhs[i]] at position i
				if (comparison !== 0) { return comparison; }
				return Math.sign(chars[0] - chars[1]);
			}, 0);

			return make_bool((comp === 0) ? (this.value.count() > txt.value.count()) : (comp > 0));
		}
	}),
	"('@':)": dispatch({
		'Integer': function(n) {
			let idx = n.value < 0 ? this.value.count() + n.value : n.value;
			let ch = this.value.get(idx);
			return ch ? new Text({value: List([ch]), scope: this.scope}) : new Bottom({scope: this.scope});
		}
	}),
	'(reverse.)': function() {
		return new Text({value: this.value.reverse(), scope: this.scope});
	},
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
				items = this.value.reduce((result, item) => {
					return result.push(new Text({value: [item], scope: this.scope}));
				}, List([]));

				return new List_({items: items, scope: this.scope});
			}

			let splits = this.value.reduce((result, item) => {
				let res;

				if (result[2].count() === 0 && item === s.value[0]) {
					// Ended a match and started a new one
					return [result[0].push(List([])), List([item]), List(s.value).rest()];
				} else if (result[2].count() === 0) {
					// Ended a match
					return [result[0].push(List([item])), List([]), List(s.value)];
				} else if (result[2].get(0) === item) {
					// Starting or continuing a match
					return [result[0], result[1].push(item), result[2].slice(1)];
				} else if (result[2].count() < s.value.count()) {
					// Reset after a false start
					res = result[0].update(-1, (v) => {
						return v.concat(result[1]).push(item);
					});
					return [res, List([]), List(s.value)];
				} else {
					// Continue outside a match
					res = result[0].update(-1, (v) => {
						return v.push(item);
					});
					return [res, result[1], result[2]];
				}
			}, [List([List([])]), List([]), List(s.value)]);

			let texts = splits[0].map((item) => {
				return new Text({value: item, scope: this.scope});
			});

			if (splits[2].count() === 0) {
				return new List_({
					items: texts.push(new Text({
						value: List([]), scope: this.scope
					})),
					scope: this.scope
				});
			} else if (splits[2].count() < s.value.count()) {
				let fixed = texts.update(-1, (t) => {
					return t.update('value', (v) => {
						return v.concat(splits.get(1));
					});
				});
				return new List_({items: fixed, scope: this.scope});
			} else {
				return new List_({items: texts, scope: this.scope});
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
