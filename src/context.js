const { MatchError, NotImplemented } = require('./error');
const { Map, List, Set, Record } = require('immutable');
const Text = require('./ast/text');
const Bottom = require('./ast/bottom');
//const Invocation = require('./ast/invocation');
const KeyValuePair = require('./ast/keyvaluepair');
const Symbol_ = require('./ast/symbol');
const _ = null;
const _map = Map({});


function Context(outer) {
	// Creates a new Context object. A context is a map of bindings from
	// scoped identifiers to memory locations (In this implementation,
	// "memory" is a dictionary from JS symbols to L values.) This
	// implementation is in anticipation of the addition of hygenic macros.
	// See Matthew Flatt's work on hygenic macros in Racket for more info.
	//
	// https://www.youtube.com/watch?v=Or_yKiI3Ha4
	// http://www.cs.utah.edu/plt/publications/popl16-f.pdf
	// http://www.cs.utah.edu/~mflatt/scope-sets/

	//this.bindings = Map({});
	this.outer = outer || null;
	this.locals = {};
	this.buffer = [];
	this.scope = null;
	this.debug = false;
}

Context.prototype.loadGlobals = function(scope) {
	const globalScope = Set([]);

	let globals = {
		'Integer': require('./impl/integer'),
		'Rational': require('./impl/rational'),
		'Decimal': require('./impl/decimal'),
		'Complex': require('./impl/complex'),
		'Text': require('./impl/text'),
		'List': require('./impl/list'),
		'Map': require('./impl/map'),
		'Block': require('./impl/block'),
		'Symbol': require('./impl/symbol'),
		// TODO: Are there built-in methods that all records and unions use?
		// Experimental Concurrency Type
		// 'Fuzzum': require('./impl/filament'),
	};
	
	Object.keys(globals).map((key) => {
		let binding = scope.addBinding({label: key, scope: globalScope});
		this.locals[binding] = globals[key];
	});
}

Context.prototype.get = function(binding) {
	let value = this.locals[binding];
	return (value === undefined && this.outer) ? this.outer.get(binding) : value;
};

Context.prototype.set = function(binding, value) {
	this.setOuter(binding, value) || this.setLocal(binding, value);
};

Context.prototype.setLocal = function(binding, value) {
	this.locals[binding] = value;
};

Context.prototype.setOuter = function(binding, value) {
	if (this.locals.hasOwnProperty(binding)) {
		// The binding is already in locals. Update it.
		this.locals[binding] = value;
		return true;
	} else if (this.outer) {
		// There's an outer scope. Try to set the value there.
		return this.outer.setOuter(binding, value);
	} else {
		return false;
	}
};

Context.prototype.push = function(binding, value) {
	this.buffer.push(() => {
		this.set(binding, value);
	});
};

Context.prototype.flush = function() {
	this.buffer.map((item) => { item.call(this); });
	this.buffer = [];
};

Context.prototype.match = function(pattern, value) {
	// TODO: allow more diverse forms with backreferences, etc
	// like `[a, b..., a, c...]`
	let locals = {};
	let capture = function(pattern, value, ctx) {
		// TODO: Abstract the list decomposition procedure to re-use for blocks
		// let decompose = function(a, b) { ... }
		if (ctx === null) { return null; }

		if ((pattern._name === 'List' || pattern._name === 'Block')
				&& pattern._name === value._name) {
			let field = (pattern._name === 'List') ? 'items' : 'exprs';

			let pat = pattern.get(field);
			let val = value.get(field);

			// Test the first value.
			let [first, rest] = [pat.first(), pat.rest()];

			// capture([], []) -> {}
			// capture([], [V]) -> <NO MATCH>
			if (!first) {
				return val.count() ? null : ctx;
			}

			if (first._name === 'Identifier' && first.getIn(['tags', 'collect'], false)) {
				// The first item is an identifier splat
				if (rest.isEmpty()) {
					// We've reached the end of the pattern
					//
					// capture([a...], []) -> {a: []}
					// capture([a...], [V1]) -> {a: [V1]}
					// capture([a...], [V1, V2, ..., Vn]) -> {a: [V1, V2, ..., Vn]}
					if (first.label === '_') {
						return ctx;
					} else {
						if (first.getIn(['tags', 'local']) === true) {
							// console.log(`binding ${value} to ${first.debugString()}`);
							ctx.setLocal(first.binding, value);
						} else {
							// console.log(`deferring ${value} to ${first.debugString()}`);
							ctx.push(first.binding, value);
						}
						locals[first.label] = value;
						return ctx;
					}
				} else {
					// We need to match from the last item forward
					//
					// capture([a..., b], [V1]) -> capture([a...], []) + {b: V1}
					// capture([a..., b], [V1, V2, ..., Vn-1, Vn]) -> 
					//           capture([a...], [V1, V2, ..., Vn-1]) + {b: Vn}
					let innerCtx = capture(pat.last(), val.last(), ctx);

					return innerCtx && capture(
						pattern.set(field, pat.butLast()),
						value.set(field, val.butLast()),
						innerCtx
					);
				}
			} else {
				// The first item is literally anything else
				//
				// capture([a], [V1]) -> capture(a, V1)
				// capture([a, b], [V1, V2]) ->
				//                          capture(a, V1) + capture([b], [V2])
				// capture([a, b...], [V1]) ->
				//                         capture(a, V1) + capture([b...], [])
				// capture([a, b...], [V1, V2, ... Vn]) ->
				//              capture(a, V1) + capture([b...], [V2, ..., Vn])
				// capture([a, b..., c], [V1, V2, ..., Vn]) ->
				//           capture(a, V1) + capture([b..., c], [V2, ..., Vn])
				//
				let innerCtx = capture(first, val.first(), ctx);
				return innerCtx && capture(
					pattern.set(field, rest),
					value.set(field, val.rest()),
					innerCtx
				);
			}
		} else if (pattern._name === 'List' && value._name === 'Map') {
			let [first, rest] = [pattern.items.first(), pattern.items.rest()];

			if (!first) {
				return value.items.count() ? null : ctx;
			}

			if (first._name === 'Identifier' && first.getIn(['tags', 'collect'], false)) {
				// The first item is an identifier splat
				if (rest.isEmpty()) {
					if (first.label === '_') {
						return ctx;
					} else {
						if (first.getIn(['tags', 'local']) === true) {
							// console.log(`binding ${value} to ${pattern.debugString()}`);
							ctx.setLocal(first.binding, value);
						} else {
							// console.log(`deferring ${value} to ${pattern.debugString()}`);
							ctx.push(first.binding, value);
						}
						locals[first.label] = value;
						return ctx;
					}
				} else {
					let contains_splat = pattern.items.rest().reduce((has_splat, item) => {
						if (has_splat === true) { return true; }

						if (item._name === 'Identifier') {
							return item.getIn(['tags', 'collect'], false);
						} else {
							return false;
						}
					}, false);

					// TODO: This should ideally raise an error
					// This isn't just a bad match, it's literally wrong
					if (contains_splat) { return null; }

					let pat = pattern.update('items', (items) => {
						return items.rest().push(items.first());
					});
					return capture(pat, value, ctx);
				}
			} else if (first._name === 'KeyValuePair' || first._name === 'Identifier') {
				// The item is an identifier or key value pair
				let key, val;
				
				if (first._name === 'Identifier') {
					key = new Symbol_({label: first.label, scope: value.scope});
					val = first;
				} else {
					key = first.key;
					val = first.val;
				}

				let map = value.items.reduce((map, item) => {
					return map.set(item.key, item.val);
				}, Map({}));

				let innerCtx = capture(val, map.get(key), ctx);
				
				return innerCtx && capture(
					pattern.set('items', rest),
					value.update('items', (items) => {
						return List(items.reduce((map, item) => {
							if (item.key.equals(key)) {
								return map;
							} else {
								return map.set(item.key, item);
							}
						}, Map({})).valueSeq());
					}),
					innerCtx
				);
			}
			return null;
		} else if (pattern._name === 'Identifier') {
			let type = pattern.getIn(['tags', 'type'], null);
			// TODO: Type check here.
			if (pattern.label !== '_') {
				if (pattern.getIn(['tags', 'local']) === true) {
					// console.log(`binding ${value} to ${pattern.debugString()}`);
					ctx.setLocal(pattern.binding, value);
				} else {
					// console.log(`deferring ${value} to ${pattern.debugString()}`);
					ctx.push(pattern.binding, value);
				}
				locals[pattern.label] = value;
			}

			return ctx;
		} else if (pattern._name === 'Symbol' && value._name === 'Symbol') {
			// TODO: Replace each of these test cases with an equality
			// method defined on each AST node
			return (value.label === pattern.label) ? ctx : null;
		} else if (pattern._name === 'Record') {

		} else if (pattern._name === 'Tuple' && value._name === 'Tuple') {
			if (value.label === pattern.label) {
				// TODO: Match on pattern inner values
				if (pattern.values.count() !== value.values.count()) { return null; }

				return pattern.values.zip(value.values).reduce(function(result, value) {
					return capture(value[0], value[1], result);
				}, ctx);
			} else {
				return null;
			}
		} else if (pattern._name === 'Text' && value._name === 'Text') {
			return (value.value.equals(pattern.value)) ? ctx : null;
		} else if (pattern._name === 'Integer' && value._name === 'Integer') {
			return (value.value === pattern.value) ? ctx : null;
		} else if (pattern._name === 'Decimal' && value._name === 'Decimal') {
			return (value.equals(pattern)) ? ctx : null;
		} else if (pattern._name === 'Scientific' && value._name === 'Scientific') {
			return (value.equals(pattern)) ? ctx : null;
		} else if (pattern._name === 'Complex' && value._name === 'Complex') {
			return (value.equals(pattern)) ? ctx : null;
		} else {
			return null;
			/*throw new NotImplemented(
				"`" + pattern + "('==': " + value + ")` is not yet implemented"
			);*/
			// This is where we test value equivalence
			// TODO: This should maybe call the equality method on the value
			// (but which side is the target and which is the argument?)
			// TODO: Importing Invocation creates a circular reference
			/*let isEqual = (new Invocation({
				target: pattern, plist: new KeyValuePair({
					key: new Text({value: "'=='"}), val: value
				})
			})).eval(ctx);*/

			if (isEqual._name === 'Symbol' && isEqual.label === 'True') {
				return ctx;
			} else {
				return null;
			}
		}
	};

	let ctx = capture(pattern, value, new Context(this));

	if (ctx) {
		ctx.scope = this.scope;
		return [ctx, Map(locals)];
	} else {
		return null;
	}
};

// TODO: Should underscore be a special case in the parser?
//Context.prototype['_'] = new AST.Bottom({});

module.exports = Context;
