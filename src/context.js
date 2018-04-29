const { MatchError } = require('./error');
const { Map, Record } = require('immutable');
const Bottom = require('./ast/bottom');
//const Message = require('./ast/message');
const Invocation = require('./ast/invocation');
const List = require('./ast/list');
const _ = null;
const _map = Map({});

const builtins = Map({
	'Integer': require('./impl/integer'),
	//'Decimal': _,
	'Text': require('./impl/text'),
	//'List': _,
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
						new List({items: pattern.items.butLast(), tags: pattern.tags}),
						new List({items: value.items.butLast(), tags: value.tags}),
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
					new List({items: rest, tags: pattern.tags}),
					new List({items: value.items.rest(), tags: value.tags}),
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




Context.prototype[':'] = function(identifier, value) {
	// THIS MUTATES THE CONTEXT!!!!
	// Assignment operator.
	// Match the lhs and rhs of the expression
	// TODO: walk up the contexts and find a value?
	var ctx = this.match(identifier, value);
	
	if (ctx === null) {
		throw new MatchError('incorrect match');
	} else {
		this.local = this.local.merge(ctx);
	}
	console.log(ctx);
	return ctx;//AST.Dictionary({kvlist: List;
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
// TODO: The context should probably point to some sort of object context
// console.log(Context);
// AST.Integer.prototype.ctx = new Context(Map(methods), null);
/*
AST.Integer.prototype.ctx = new Context(Map(numbers.Integer), null);
AST.Rational.prototype.ctx = new Context(Map(numbers.Rational), null);
AST.Decimal.prototype.ctx = new Context(Map(numbers.Decimal), null);
AST.Complex.prototype.ctx = new Context(Map(numbers.Complex), null);

AST.List.prototype.ctx = new Context(Map(collections.List), null);
AST.Map.prototype.ctx = new Context(Map(collections.Dictionary), null);

AST.Text.prototype.ctx = new Context(Map(text.Text), null);

AST.Block.prototype.ctx = new Context(Map(blocks.Block), null);
AST.Record.prototype.ctx = new Context(Map(types.Record), null);
*/
// Context.prototype['String'] = AST.String.prototype.ctx;
// Context.prototype['Integer'] = AST.Integer.prototype.ctx;
// Context.prototype['Rational'] = AST.Rational.prototype.ctx;
// Context.prototype['Decimal'] = AST.Decimal.prototype.ctx;
// Context.prototype['Complex'] = AST.Complex.prototype.ctx;
// Context.prototype['List'] = AST.List.prototype.ctx;

module.exports = Context;
