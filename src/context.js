const { MatchError } = require('./error');
const { Map, Record } = require('immutable');
const Bottom = require('./ast/bottom');
//const Message = require('./ast/message');
const Invocation = require('./ast/invocation');
const _ = null;
const _map = Map({});

const builtins = Map({
	'Integer': require('./impl/integer'),
	//'Decimal': _,
	'Text': require('./impl/text'),
	'List': require('./impl/list'),
	//'Map': _,
	//'Block': _,
	//'Record': _,
});


//const Context = Record({local: _map, outer: _}, 'Context');
function Context(values) {
	this.local = (values && values.local) || builtins;
	this.outer = (values && values.outer) || _;
}

Context.prototype.extend = function(pattern, value) {
	let captured = this.match(pattern, value);
	return captured ? new Context({local: captured, outer: this}) : null;
};

Context.prototype.lookup = function(name) {
	let value = this.local.get(name, null);
	if (value == null && this.outer != null) {
		return this.outer.lookup(name);
	} else {
		return value || new Bottom();
	}
};

Context.prototype.match = function(pattern, value) {
	// TODO: allow more diverse forms with backreferences, etc
	// like `[a, b..., a, c...]`
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
			// capture([], [V]) -> <NO MATCH>
			if (!first) {
				return value.items.count() ? null : ctx;
			}

			// capture([a..., b], [V1]) -> capture([a...], []) + {b: V1}
			// capture([a..., b], [V1, V2, ..., Vn-1, Vn]) -> 
			//                   capture([a...], [V1, V2, ..., Vn-1]) + {b: Vn}

			// capture([a...], []) -> {a: []}
			// capture([a...], [V1]) -> {a: [V1]}
			// capture([a...], [V1, V2, ..., Vn]) -> {a: [V1, V2, ..., Vn]}
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

					let innerCtx = capture(last, value.set('items', value.items.last()), ctx);
					return innerCtx && capture(
						pattern.set('items', pattern.items.butLast()),
						value.set('items', value.items.butLast()),
						innerCtx
					);
				}
			}

			// capture([a], [V1]) ->                                    {a: V1}
			// capture([a, b], [V1, V2]) ->        capture([b], [V2]) + {a: V1}
			// capture([a, b...], [V1]) ->        capture([b...], []) + {a: V1}
			// capture([a, b..., c], [V1, V2, ..., Vn]) ->
			//                      capture([b..., c], [V2, ..., Vn]) + {a: V1}
			if (rest.isEmpty() && value.items.count() === 1) {
				return capture(first, value.items.first(), ctx);
			} else if (rest.isEmpty()) {
				return null;
			} else {
				let innerCtx = capture(first, value.set('items', value.items.first()), ctx);
				return innerCtx && capture(
					pattern.set('items', rest),
					value.set('items', value.items.rest()),
					innerCtx
				);
			}
		} else if (pattern._name === 'Block') {
			if (value._name !== 'Block') { return null; }

			// Test the first value.
			let [first, rest] = [pattern.exprs.first(), pattern.exprs.rest()];

			// capture({}, {}) -> {}
			// capture({}, {V1}) -> <NO MATCH>
			if (!first) {
				return value.exprs.count() ? null : ctx;
			}

			// capture({a..., b}, {V1}) ->        capture({a...}, {}) + {b: V1}
			// capture({a..., b}, {V1, V2, ..., Vn-1, Vn}) ->
			//                   capture({a...}, {V1, V2, ..., Vn-1}) + {b: Vn}

			// capture({a...}, {}) -> {a: {}}
			// capture({a...}, {V1}) -> {a: {V1}}
			// capture({a...}, {V1, V2, ..., V3}) -> {a: {V1, V2, ..., V3}}
			if (first._name === 'Identifier' && first.getIn(['tags', 'collect'], false)) {
				if (rest.isEmpty()) {
					return ctx.set(first.label, value);
				} else {
					let last = pattern.exprs.last();

					if (last._name === 'Identifier' && last.getIn(['tags', 'collect'], false)) {
						return null;
					}

					let innerCtx = capture(last, value.set('exprs', value.exprs.last()), ctx);
					return innerCtx && capture(
						pattern.set('exprs', pattern.exprs.butLast()),
						value.set('exprs', value.exprs.butLast()),
						innerCtx
					);
				}
			}

			// capture({a}, {V1}) -> {a: V1}
			// capture({a, b}, {V1, V2}) -> capture({b}, {V2}) + {a: V1}
			// capture({a, b...}, {V1}) -> capture({b...}, {}) + {a: V1}
			// capture({a, b..., c}, {V1, V2, ..., V3}) -> capture({b..., c}, {V2, ..., V3}) + {a: V1}
			if (rest.isEmpty() && value.exprs.count() === 1) {
				return capture(first, value, ctx);
			} else if (rest.isEmpty()) {
				return null;
			} else {
				let innerCtx = capture(first, value.set('exprs', value.exprs.first()), ctx);
				return innerCtx && capture(
					pattern.set('exprs', rest),
					value.set('exprs', value.exprs.rest()),
					innerCtx
				);
			}
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
			let isEqual = (new Invocation({
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

	let ctx = capture(pattern, value, Map({}));
	return ctx;
};

// TODO: Should underscore be a special case in the parser?
//Context.prototype['_'] = new AST.Bottom({});
/*
var text = require('./impl/text');
var numbers = require('./impl/numbers');
var collections = require('./impl/collections');
var blocks = require('./impl/blocks');
var types = require('./impl/types');
*/

module.exports = Context;
