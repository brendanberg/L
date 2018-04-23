
const { Map, List, Record } = require('immutable');
const _ = null;
const _map = Map({});
const _list = List([]);


Option = Record({variants: _list, label: _, ctx: _, tags: _map}, 'Option');

Option.prototype.toString = function () {
	let variants = this.variants.map(function(node) {
		return node.toString();
	});
	return '<< ' + variants.join(' | ') + ' >>';
};

Option.prototype.repr = function (depth, fmt) {
	let variants = this.variants.map(function(node) {
		return node.repr(depth, fmt);
	});

	return (
		style.delimiter('<<') + 
		variants.join(style.delimiter(' | ')) +
		style.delimiter('>>')
	);
};

Option.prototype.eval = function(ctx) {
	return this;

	// TODO: I guess there needs to be some bookkeeping here?
	// ------------------------------------------------------
	// var values = {};
	// this.variants.forEach(function(variant) {
	// 	values[variant.name] = new Tag({
	// 		name: variant.name,
	// 		ctx: ctx
	// 	});
	// });
	// 
	// return this.set('ctx', Map(values));
};

Option.prototype.transform = function(context, match) {
	// Note: This rule should be unreachable if the grammar rules are correct
	return this;
};

module.exports = Option;

