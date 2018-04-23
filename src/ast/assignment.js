/*
   Assignment AST node
 */

let I = require('immutable');
const KeyValuePair = require('./keyvaluepair');
const Map = require('./map');
const Symbol = require('./symbol');

const _ = null;
const _map = I.Map({});
const _list = I.List([]);


let Assignment = I.Record({template: _, value: _, tags: _map}, 'Assignment');

Assignment.prototype.toString = function() {
    return this.template.toString() + ' :: ' + this.value.toString();
};

Assignment.prototype.repr = function(depth, style) {
    return (
        this.template.repr(depth, style) +
        style.operator(' :: ') +
        this.value.repr(depth, style)
    );
};

Assignment.prototype.eval = function(ctx) {
	// Recursively descend through the template, matching value equivalence
	// between template and evaluated right-hand expression and capturing
	// values into identifier placeholders in the template.
	let newCtx = ctx.match(this.template.match, this.value.eval(ctx));

	// TODO: Is this really supposed to mutate the current context?
	ctx.local = ctx.local.merge(newCtx);

	return newCtx && new Map({items: newCtx.map(function(val, key) {
		return new KeyValuePair({key: new Symbol({label: key}), val: val});
	})});
};

Assignment.prototype.transform = function(func) {
    return func(this);
};

module.exports = Assignment;

