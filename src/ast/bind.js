/*
   Bind AST node
 */

const { Record, Map, List } = require('immutable');
const KeyValuePair = require('./keyvaluepair');
const Map_ = require('./map');
const List_ = require('./list');
const Symbol_ = require('./symbol');
const Bottom = require('./bottom');

const _ = null;
const _map = Map({});
const _list = List([]);


let Bind = Record({template: _, value: _, scope: _, tags: _map}, 'Bind');

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
	let match = ctx.match(this.template, this.value.eval(ctx)[0]);

	if (match) {
		let [_, changeSet] = match;

		//console.log('setting local', ctx);
		let retval = new Map_({
			items: List(changeSet.entrySeq().map(([label, val]) => {
				return new KeyValuePair({
					key: new Symbol_({label: label, scope: this.scope}),
					val: val,
					scope: this.scope});
			}))
		});

		// A block that recursively references the identifier it is being
		// bound to will have an undefined reference to the identifier in
		// the outer scope. We resolve that here.
		for (let key of Object.keys(ctx.locals || {})) {
			// TODO: We're taking advantage of mutable contexts and modifying
			// locals as we walk the AST. We should be modifying the node's
			// context and returning the modified node.
			// THIS IS GOING TO BE A PAINFUL REFACTOR!
			if (ctx.locals[key].transform) {
				ctx.locals[key].transform((node) => {
					if (node._name === 'Block' && node.context) {
						node.closures.map((outer, inner) => {
							if (node.context[inner] === undefined) {
								node.context[inner] = ctx.get(outer);
							}
						});
					}
					return node;
				});
			} else {
				console.log('BIND ERROR. resolve rec: [' + key + '] = ' + ctx.locals[key]);
				console.log(ctx.locals);
			}
		}

		return [retval, ctx];
	} else {
		return [new Bottom(), ctx];
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

