var AST = require('./ast');
var error = require('./error');
var extend = require('util')._extend;
var I = require('immutable');

var Context = function(local, outer) {
	this.local = I.Map(local) || I.Map();
	this.outer = outer || null;
};

// TODO: This should be a function on the global L object, not the context.
/*Context.prototype.match = function(pattern, value) {
	var values = Array.prototype.slice.call(arguments).slice(1);
	var ctx = {'__': value};
	var key, val;
	//ctx.local = ctx.local.set('__', value);
	// console.log('attempt to match ' + pattern + ' with ' + value);

	if (pattern._name === 'List') {
		if (value._name != 'List') {
			throw new error.TypeError('List destructuring requires list');
		}

		// List destructuring works on the following forms
		// `[a, b...]`, `[a, b, c...]`, etc.
		// `[a, b..., c]`, `[a, b, c..., d]`, `[a, b..., c, d]`, etc.
		// `[a..., b]`, `[a..., b, c]`, etc.
		// TODO: allow more diverse forms with backreferences, etc
		// like `[a, b..., a, c...]`

		// LtR?
		// [] : [0]                     | no match.
		// [a] : [0, 1]                 | no match.
		// [a] : []                     | no match.
		// [a] : [0]                    | a = 0
		// [a, b] : [0]                 | no match.
		// [a, b] : [0, 1]              | a = 0, b = 1
		// [a, b...] : [0]              | a = 0, b = []
		// [a, b...] : [0, 1]           | a = 0, b = [1]
		// [a, b...] : [0, 1, 2]        | a = 0, b = [1, 2]
		// [a, b..., c] : [0, 1, 2]     | a = 0, b = [1], c = 2
		// [a, b..., c] : [0, 1, 2, 3]  | a = 0, b = [1, 2], c = 3

		var patt = pattern.list.slice();
		var list = value.list.slice();
		while (patt.length > 0 &&
				patt[0].tags['modifier'] != '...') {
			val = list.shift();
			if (val === undefined) {
				throw new error.MatchError("not enough values in source list");
			}
			ctx[patt.shift().name] = val;
		}
		while (patt.length > 0 &&
				patt[patt.length - 1].tags['modifier'] != '...') {
			val = list.pop();
			if (val === undefined) {
				throw new error.MatchError("not enough values in source list");
			}
			ctx[patt.pop().name] = val;
		}

		if (patt.length === 1) {
			var val = new AST.List({
				list: I.List(list.slice()), // TODO: fn'al way to do this?
				tags: I.Map({source: 'list'})
			});
			ctx[patt[0].name] = val;
			return ctx;
		} else if (patt.length > 1) {
			throw new error.MatchError("target list may only have one ellipsis");
		}

		if (list.length > 0) {
			return null;
		} else {
			return ctx;
		}
	} else if (pattern._name === 'Identifier') {
		ctx[pattern.name] = value;
		return ctx;
		//return new Context(null, ctx);
	} else if (pattern._name === 'Integer') {
		return pattern.value === value.value ? ctx : null;
	} else if (pattern._name === 'String') {
		return pattern.value === value.value ? ctx : null;
	} else if (pattern._name === 'Tag') {
		if (pattern.name === value.name) { // && this.name in x.variants) {
			return ctx;
		} else {
			return null;
		}
	} else {
		return null;
	}
};*/

Context.prototype.match = function(pattern, value) {
	let capture = function(pattern, value, ctx) {
		// TODO: Abstract the list decomposition procedure to re-use for blocks
		// let decompose = function(a, b) { ... }
		if (ctx === null) { return null; }

		if (pattern._name === 'List') {
			// TODO: Eventually add support for maps. (How?)
			if (value._name !== 'List') { return null; }

			// Test the first value.
			let [first, rest] = [pattern.items.first(), pattern.items.rest()];

			// capture([], []) -> {}
			// capture([], [*]) -> <NO MATCH>
			if (!first) {
				return value.items.count() ? null : ctx;
			}

			// capture([a..., b], [*]) -> capture([a...], []) + {b: *}
			// capture([a..., b], [*..., *]) -> capture([a...], [*...]) + {b: *}

			// capture([a...], []) -> {a: []}
			// capture([a...], [*]) -> {a: [*]}
			// capture([a...], [*, *...]) -> {a: [*, *...]}
			if (first._name === 'Identifier' && first.getIn(['tags', 'collect'], false)) {
				if (rest.isEmpty()) {
					return ctx.set(first.label, value);
					// The same as `capture(first, value)`
				} else {
					// Pick the last item off the list and go deeper
					let last = pattern.items.last();

					if (last._name === 'Identifier' && last.getIn(['tags', 'collect'], false)) {
						// TODO: Should this really be an exception?
						return null;
					}

					let innerCtx = capture(last, value.items.last(), ctx);
					return innerCtx && capture(
						new AST.List({items: pattern.items.butLast(), tags: pattern.tags}),
						new AST.List({items: value.items.butLast(), tags: value.tags}),
						innerCtx
					);
				}
			}

			// capture([a] [*] -> {a: *}
			// capture([a, b], [*, *]) -> capture([b], [*]) + {a: *}
			// capture([a, b...], [*]) -> capture([b...], []) + {a: *}
			// capture([a, b..., c], [*, *..., *]) -> capture([b..., c], [*..., *]) + {a: *}
			if (rest.isEmpty() && value.items.count() === 1) {
				return capture(first, value.items.first(), ctx);
			} else if (rest.isEmpty()) {
				return null;
			} else {
				let innerCtx = capture(first, value.items.first(), ctx);
				return innerCtx && capture(
					new AST.List({items: rest, tags: pattern.tags}),
					new AST.List({items: value.items.rest(), tags: value.tags}),
					innerCtx
				);
			}
		} else if (pattern._name === 'Block') {
			if (value._name !== 'Block') { console.log('block'); return null; }
			// TODO: The same strategy here.
		} else if (pattern._name === 'Identifier') {
			let type = pattern.getIn(['tags', 'type'], null);
			// TODO: Type check here.
			return ctx.set(pattern.label, value);
		} else if (pattern._name === 'Symbol') {
			// TODO: Replace each of these test cases with an equality
			// method defined on each AST node
			if (value._name === 'Symbol' && value.label === pattern.label) {
				return ctx;
			} else { 
				return null;
			}
		} else if (pattern._name === 'Text') {
			if (value._name === 'Text' && value.value === pattern.value) {
				return ctx;
			} else {
				return null;
			}
		} else if (pattern._name === 'Integer') {
			if (value._name === 'Integer' && value.value === pattern.value) {
				return ctx;
			} else {
				return null;
			}
		} else if (pattern._name === 'Decimal') {
			if (value._name === 'Decimal' &&
					value.numerator === pattern.numerator &&
					value.exponent === pattern.exponent) {
				return ctx;
			} else {
				return null;
			}
		} else if (pattern._name === 'Scientific') {
			if (value._name === 'Scientific' &&
					value.significand === pattern.significand &&
					value.mantissa === pattern.mantissa) {
				return ctx;
			} else {
				return null;
			}
		} else if (pattern._name === 'Complex') {
			if (value._name === 'Complex' &&
					value.real === pattern.real &&
					value.imaginary === pattern.imaginary) {
				return ctx;
			} else {
				return null;
			}
		} else {
			// This is where we test value equivalence
			// TODO: This should maybe call the equality method on the value
			// (but which side is the target and which is the argument?)
			let isEqual = (new AST.Invocation({
				target: value, plist: new AST.Message({
					___: _,
					___: pattern
				})
			})).eval(ctx);

			if (isEqual._name === 'Member' && isEqual.label === 'True') {
				return ctx;
			} else {
				return null;
			}
		}
	};

	let ctx = capture(pattern, value, I.Map({}));
	return ctx;
};

Context.prototype.match.curry = function() {
	if (arguments.length < 1) {
		return this;
	}

	var self = this;
	var args = Array.prototype.slice.call(arguments);

	return function () {
		return self.apply(this, args.concat(Array.prototype.slice.call(arguments)));
	};
};

Context.prototype.extend = function(pattern, value) {
	let captured = this.match(pattern, value);
	return captured && new Context(captured, this);
};

Context.prototype.lookup = function(name) {
	var value = this.local.get(name, null);
	if (value == null && this.outer != null) {
		return this.outer.lookup(name);
	} else {
		return value;
	}
};

Context.prototype.eval = function(ast) {

};

Context.prototype[':'] = function(identifier, value) {
	// THIS MUTATES THE CONTEXT!!!!
	// Assignment operator.
	// Match the lhs and rhs of the expression
	// TODO: walk up the contexts and find a value?
	var ctx = this.match(identifier, value);
	
	if (ctx === null) {
		throw new error.MatchError('incorrect match');
	} else {
		this.local = this.local.merge(ctx);
	}
	console.log(ctx);
	return ctx;//AST.Dictionary({kvlist: I.List;
};

// TODO: Should underscore be a special case in the parser?
Context.prototype['_'] = new AST.Bottom();

var text = require('./impl/text');
var numbers = require('./impl/numbers');
var collections = require('./impl/collections');
var blocks = require('./impl/blocks');
var types = require('./impl/types');

// TODO: The context should probably point to some sort of object context
// console.log(Context);
// AST.Integer.prototype.ctx = new Context(I.Map(methods), null);

AST.Integer.prototype.ctx = new Context(I.Map(numbers.Integer), null);
AST.Rational.prototype.ctx = new Context(I.Map(numbers.Rational), null);
AST.Decimal.prototype.ctx = new Context(I.Map(numbers.Decimal), null);
AST.Complex.prototype.ctx = new Context(I.Map(numbers.Complex), null);

AST.List.prototype.ctx = new Context(I.Map(collections.List), null);
AST.Map.prototype.ctx = new Context(I.Map(collections.Dictionary), null);

AST.Text.prototype.ctx = new Context(I.Map(text.Text), null);

AST.Block.prototype.ctx = new Context(I.Map(blocks.Block), null);
AST.Record.prototype.ctx = new Context(I.Map(types.Record), null);

// Context.prototype['String'] = AST.String.prototype.ctx;
// Context.prototype['Integer'] = AST.Integer.prototype.ctx;
// Context.prototype['Rational'] = AST.Rational.prototype.ctx;
// Context.prototype['Decimal'] = AST.Decimal.prototype.ctx;
// Context.prototype['Complex'] = AST.Complex.prototype.ctx;
// Context.prototype['List'] = AST.List.prototype.ctx;

module.exports = Context;
