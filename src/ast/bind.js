/*
   Bind AST node
 */

const { Record, Map, List } = require('immutable');
const KeyValuePair = require('./keyvaluepair');
const Map_ = require('./map');
const List_ = require('./list');
const Symbol_ = require('./symbol');

const _ = null;
const _map = Map({});
const _list = List([]);


let Bind = Record({template: _, value: _, tags: _map}, 'Bind');

Bind.prototype.toString = function() {
    return this.template.toString() + ' :: ' + this.value.toString();
};

Bind.prototype.repr = function(depth, style) {
    return (
        this.template.repr(depth, style) +
        style.operator(' :: ') +
        this.value.repr(depth, style)
    );
};

Bind.prototype.eval = function(ctx) {
	// Recursively descend through the template, matching value equivalence
	// between template and evaluated right-hand expression and capturing
	// values into identifier placeholders in the template.
	let match = ctx.match(this.template, this.value.eval(ctx));

	if (match) {
		let [newCtx, changeSet] = match;
		// This is a nasty hack to get flush() to update the context we're
		// passing around.
		newCtx.outer = ctx.outer;
		newCtx.locals = ctx.locals;
		newCtx.flush();
		// console.log(ctx.locals);
		return new Map_({
			items: List(changeSet.entrySeq().map(([label, val]) => {
				return new KeyValuePair({key: new Symbol_({label: label}), val: val});
			}))
		});
	} else {
		return null;
	}
};

Bind.prototype.transform = function(func) {
    return func(this.update('template', (template) => {
		return ('transform' in template) ? template.transform(func) : func(template);
	}).update('value', (val) => {
		return ('transform' in val) ? val.transform(func) : func(val);
	}));
};

module.exports = Bind;

