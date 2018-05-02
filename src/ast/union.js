
const { Map, List, Record } = require('immutable');
const _ = null;
const _map = Map({});
const _list = List([]);


Union = Record({label: _, variants: _list, ctx: _, tags: _map}, 'Union');

Union.prototype.toString = function () {
	let variants = this.variants.map(function(node) {
		return node.toString();
	});
	return this.label + '<< ' + variants.join(' | ') + ' >>';
};

Union.prototype.repr = function(depth, style) {
	let variants = this.variants.map(function(node) {
		return node.repr(depth, style);
	});

	return (
		style.name(this.label) + style.delimiter(' << ') + 
		variants.join(style.delimiter(' | ')) + style.delimiter(' >>')
	);
};

Union.prototype.eval = function(ctx) {
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

Union.prototype.transform = function(context, match) {
	// Note: This rule should be unreachable if the grammar rules are correct
	return this;
};

module.exports = Union;

