/*
   Bind AST node
 */

let I = require('immutable');
const KeyValuePair = require('./keyvaluepair');
const Map = require('./map');
const Symbol = require('./symbol');

const _ = null;
const _map = I.Map({});
const _list = I.List([]);


let Bind = I.Record({template: _, value: _, tags: _map}, 'Bind');

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
	let newCtx = ctx.match(this.template, this.value.eval(ctx));

	// TODO: Is this really supposed to mutate the current context?
	ctx.local = ctx.local.merge(newCtx);

	return newCtx && new Map({items: newCtx.map(function(val, key) {
		return new KeyValuePair({key: new Symbol({label: key}), val: val});
	})});
};

Bind.prototype.transform = function(func) {
    return func(this);
};

module.exports = Bind;

