var AST = require('./ast');
var error = require('./error');
var extend = require('util')._extend;

var Context = function() {
	
};

// TODO: This should be a function on the global L object, not the context.
Context.prototype.match = function(pattern, value) {
	var ctx = new Context();
	var key, val;
	var values = Array.prototype.slice.call(arguments).slice(1);
	ctx['__'] = value;
	// console.log('attempt to match ' + pattern + ' with ' + value);

	if (pattern.type === 'List') {
		if (value.type != 'List') {
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
			var val = new AST.List(list.slice(), {source: 'list'});
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
	} else if (pattern.type === 'Identifier') {
		ctx[pattern.name] = value;
		return ctx;
	} else if (pattern.type === 'Integer') {
		return pattern.value === value.value ? ctx : null;
	} else if (pattern.type === 'String') {
		return pattern.value === value.value ? ctx : null;
	} else if (pattern.type === 'Tag') {
		if (pattern.name === value.name) { // && this.name in x.variants) {
			return ctx;
		} else {
			return null;
		}
	} else {
		return null;
	}
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
}

Context.prototype[':'] = function(identifier, value) {
	//TODO: walk up the contexts and find a value?
	var ctx = this.match(identifier, value);
	
	if (ctx === null) {
		throw new error.MatchError('incorrect match');
	} else {
		for (var i in ctx) {
			this[i] = ctx[i];
		}
	}
};

// TODO: Should underscore be a special case in the parser?
Context.prototype['_'] = new AST.Bottom();

require('./impl/strings');
require('./impl/numbers');
require('./impl/collections');
require('./impl/blocks');
require('./impl/types');

Context.prototype['String'] = AST.String.prototype.ctx;
Context.prototype['Integer'] = AST.Integer.prototype.ctx;
Context.prototype['Rational'] = AST.Rational.prototype.ctx;
Context.prototype['Decimal'] = AST.Decimal.prototype.ctx;
Context.prototype['Complex'] = AST.Complex.prototype.ctx;
Context.prototype['List'] = AST.List.prototype.ctx;

module.exports = Context;
