const { List, Map, Set } = require('immutable');
const punycode = require('punycode');
const { ParseError } = require('./error');
const AST = require('./ast');


// TODO: REALLY BIG TODO: Error checking where possible to prevent impossible
// states in AST nodes.

let currentSymbol = 0;

function gensym() {
	// TODO: Build a better singleton symbol generator
	return '$' + (++currentSymbol).toString(36).toUpperCase();
}

const Block = function(exprs) {
	return new AST.Block({
		exprs: List(exprs),
		tags: Map({envelopeShape: '{}'}),
		scope: Set([gensym()]),
	});	
};

const Func = function (...template) {
	if (!(this instanceof Func)) {
		return new Func(template);
	}

	this.template = new AST.List({items: List(template)});
	this.scope = Set([gensym()]);
	return this;
};

Func.prototype.Where = function (guard) {
	this.guard = guard;
	return this;
};

Func.prototype.Func = function (template) {
	// TODO: how does this work?
};

Func.prototype.Block = function (exprs) {
	this.block = new AST.Block({
		exprs: List(exprs),
		tags: Map({evelopeShape: '{}'})
	});
	return AST.Function(this);
};

const Hybrid = function (...predicates) {
	return new AST.HybridFunction({
		predicates: predicates.map((func) => func.set('scope', Set([gensym()]))),
	});
};

const List_ = function (...items) {
	return new AST.List({items: List(items)});
};

const Map_ = function (items) {
	// TODO: better API here
	return new AST.Map({items: items});
};

const KeyVal = function(key, val) {
	return new AST.KeyValuePair({key: key, val: val});
};

const Ident = function (label) {
	return new AST.Identifier({label: label});
};

const Call = function (target, args) {
	let selector;

	if (args.reduce((val, item) => (val && item._name === 'KeyValuePair'), true)) {
		selector = '(' + args.reduce((s, item) => s + item.key.label + ':', '') + ')';
	} else {
		selector = null;
	}

	return new AST.Call({target: target, selector: selector, args: List(args)});
};

const Infix = function (lhs, op, rhs) {
	return new AST.InfixExpression({
		lhs: lhs, op: new AST.Operator({label: op}), rhs: rhs
	});
};

const Prefix = function (op, expr) {
	return new AST.PrefixExpression({
		op: new AST.Operator({label: op}), expr: expr
	});
};

const Symbol = function (label, type) {
	return new AST.Symbol({
		label: label,
		tags: Map({type: type})
	});
};

const Text = function (stringOrText) {
	if (stringOrText instanceof AST.Text) {
		return new AST.Text({value: stringOrText.value});
	} else if (stringOrText instanceof List) {
		return new AST.Text({value: stringOrText});
	} else {
		return new AST.Text({
			value: List(punycode.ucs2.decode(stringOrText))
		});
	}
};

const Integer = function(value) {
	return new AST.Integer({value: value, tags: Map({source_base: 10})});
}; 

const Decimal = function(stringOrFloat, exponent) {
	if (exponent !== undefined) {
		return new AST.Decimal({numerator: stringOrFloat, exponent: exponent});
	}

	if (typeof stringOrFloat !== 'string') {
		stringOrFloat = stringOrFloat.toString();
	}

	let integer, fraction, factor;

	let intPart, fracPart, match = stringOrFloat.match(/([0-9]+)(?:\.([0-9]*))?/);
	if (!match) throw new ParseError('invalid decimal representation');

	[__, intPart, fracPart, ...__] = match;
	fracPart = fracPart || '0';
	integer = parseInt(intPart, 10);
	fraction = parseInt(fracPart, 10);
	factor = Math.pow(10, fracPart.length);
	exponent = fracPart.length;

	return new AST.Decimal({
		numerator: integer * factor + fraction,
		exponent: exponent
	});
}; 

const Rational = function(stringOrNumerator, denominator) {
	let numerator;

	if (typeof stringOrNumerator === 'string') {
		let numStr, denomStr, match = stringOrNumerator.match(/([0-9]+)\/([0-9]+)/);
		if (!match) throw new ParseError('invalid rational representation');

		[__, numStr, denomStr, ...__] = match;
		numerator = parseInt(numStr, 10);
		denominator = parseInt(denomStr, 10);
	} else {
		numerator = stringOrNumerator;
	}

	return new AST.Rational({numerator: numerator, denominator: denominator}).simplify();
};

const Bottom = function () {
	return new AST.Bottom();
};

const pushScope = function(scope) {
	return function (ast) {
		return ast.transform((node) => {
			if (!(node.has)) { console.log(node); }
			if (node.has('scope')) {
				let sc1 = node.scope || Set([]);
				return node.set('scope', scope.union(sc1));
			} else {
				return node;
			}
		});
	}
};

const withEnv = function (env) {
	return function(ast) {
		return ast;
	};
};

const Arbor = {
	'Bottom': Bottom,
	'Integer': Integer,
	'Decimal': Decimal,
	'Rational': Rational,
	'Complex': function() {

	},
	'Scientific': function() {

	},
	'Ident': Ident,
	'List': List_,
	'Map': Map_,
	'KeyVal': KeyVal,
	'Call': Call,
	'Text': Text,
	'Symbol': Symbol,
	'Prefix': Prefix,
	'Infix': Infix,
	'Block': Block,
	'Func': Func,
	'Hybrid': Hybrid,

	'pushScope': pushScope,
};

module.exports = Arbor;

