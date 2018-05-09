const { MatchError, NotImplemented } = require('./error');
const { Map, Record } = require('immutable');
const Bottom = require('./ast/bottom');
const Invocation = require('./ast/invocation');
const Operator = require('./ast/operator');
const KeyValuePair = require('./ast/keyvaluepair');
const _ = null;
const _map = Map({});

const builtins = Map({
	'Integer': require('./impl/integer'),
	//'Decimal': _,
	//'Boolean': require('./impl/boolean'),
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

		if (pattern._name === 'List' || pattern._name === 'Block') {
			if (value._name !== pattern._name) { return null; }
			let field = (pattern._name === 'List') ? 'items' : 'exprs';

			// Test the first value.
			let [first, rest] = [pattern.get(field).first(), pattern.get(field).rest()];

			// capture([], []) -> {}
			// capture([], [V]) -> <NO MATCH>
			if (!first) {
				return value.get(field).count() ? null : ctx;
			}

			if (first._name === 'Identifier' && first.getIn(['tags', 'collect'], false)) {
				// The first item is an identifier splat
				if (rest.isEmpty()) {
					// We've reached the end of the pattern
					//
					// capture([a...], []) -> {a: []}
					// capture([a...], [V1]) -> {a: [V1]}
					// capture([a...], [V1, V2, ..., Vn]) -> {a: [V1, V2, ..., Vn]}
					return ctx.set(first.label, value);
				} else {
					// We need to match from the last item forward
					//
					// capture([a..., b], [V1]) -> capture([a...], []) + {b: V1}
					// capture([a..., b], [V1, V2, ..., Vn-1, Vn]) -> 
					//           capture([a...], [V1, V2, ..., Vn-1]) + {b: Vn}
					let innerCtx = capture(pattern.get(field).last(), value.get(field).last(), ctx);

					return innerCtx && capture(
						pattern.set(field, pattern.get(field).butLast()),
						value.set(field, value.get(field).butLast()),
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
				let innerCtx = capture(first, value.get(field).first(), ctx);
				return innerCtx && capture(
					pattern.set(field, rest),
					value.set(field, value.get(field).rest()),
					innerCtx
				);
			}
		} else if (pattern._name === 'Map') {
			// TODO: Eventually add support for maps. (How?)
			return null;
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
		} else if (pattern._name === 'Record') {

		} else if (pattern._name === 'Variant') {
			if (value._name === 'Variant' && value.label === pattern.label) {
				// TODO: Match on pattern inner values
				if (pattern.values.count() !== value.values.count()) { return null; }

				return pattern.values.zip(value.values).reduce(function(result, value) {
					return capture(value[0], value[1], result);
				}, ctx);
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
			throw new NotImplemented(
				"`" + pattern + "('==': " + value + ")` is not yet implemented"
			);
			// This is where we test value equivalence
			// TODO: This should maybe call the equality method on the value
			// (but which side is the target and which is the argument?)
			let isEqual = (new Invocation({
				target: pattern, plist: new KeyValuePair({
					key: new Operator({label: '=='}), val: value
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
