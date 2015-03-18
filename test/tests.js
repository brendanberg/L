var L = require('../src/parser');
var assert = require('assert');

function buildAssertion(assertion, source, result, message) {
	assertion(L.Parser.parse(source), result, message);
}

describe("The parser's", function() {

// Literals
// ----------------------------------------------------------------------

	describe('number productions', function () {
		it ('should accept well-formed integers', function () {
			buildAssertion(assert.deepEqual, "0", new L.AST.Integer(0));
			buildAssertion(assert.deepEqual, "1", new L.AST.Integer(1));
			buildAssertion(assert.deepEqual, "100", new L.AST.Integer(100));
			buildAssertion(assert.deepEqual, "1138", new L.AST.Integer(1138));
		});

		it ('should accept well-formed decimals', function () {
			buildAssertion(assert.deepEqual, "0.0", new L.AST.Decimal(0, 0));
			buildAssertion(assert.deepEqual, "1.0", new L.AST.Decimal(1, 0));
			buildAssertion(assert.deepEqual, "12.05", new L.AST.Decimal(1205, 2));
			buildAssertion(assert.deepEqual, "100.000", new L.AST.Decimal(100, 0));
			buildAssertion(assert.deepEqual, "0.1138", new L.AST.Decimal(1138, 4));
		});

		it ('should accept well-formed imaginary numbers', function () {
			buildAssertion(assert.deepEqual, "0i", new L.AST.Imaginary(
				new L.AST.Integer(0)));
			buildAssertion(assert.deepEqual, "1j", new L.AST.Imaginary(
				new L.AST.Integer(1)));
			buildAssertion(assert.deepEqual, "1.0j", new L.AST.Imaginary(
				new L.AST.Decimal(1, 0)));
			buildAssertion(assert.deepEqual, "0.123J", new L.AST.Imaginary(
				new L.AST.Decimal(123, 3)));
		});

		it ('should accept well-formed scientific numbers', function () {
			buildAssertion(assert.deepEqual, "1e10", new L.AST.Real());
			buildAssertion(assert.deepEqual, "1e-2", new L.AST.Real());
			buildAssertion(assert.deepEqual, "0.23E-14", new L.AST.Real());
		});

		it ('should accept well-formed hex integers', function () {
			buildAssertion(assert.deepEqual, "0x0", new L.AST.Integer(0));
			buildAssertion(assert.deepEqual, "0xF", new L.AST.Integer(15));
			buildAssertion(assert.deepEqual, "0xDEADBEEF",
				new L.AST.Integer(3735928559));
		});

		it ('should reject malformed numeric literals', function () {
			//buildAssertion(assert.equal, "00", 'foo');
			//buildAssertion(assert.equal, "01", 'foo');
			//buildAssertion(assert.equal, "0a", 'foo');
		});
	});

	describe ('string productions', function () {
		it ('should accept well-formed string literals', function () {
			buildAssertion(assert.deepEqual, "'hello'", new L.AST.String('hello'));
			buildAssertion(assert.deepEqual, '"hello"', new L.AST.String('hello'));
			buildAssertion(assert.deepEqual, "'Hello, world!'",
				new L.AST.String('Hello, world!'));
		});

		it ('should accept escaped characters in strings', function () {
			buildAssertion(assert.deepEqual, "'\0\t'", new L.AST.String('\0\t'));
		});
	});

	describe ('identifier productions', function () {
		it ('should accept well-formed identifiers', function () {
			buildAssertion(assert.deepEqual, "name", new L.AST.Identifier('name'));
			buildAssertion(assert.deepEqual, "_-_-_-", new L.AST.Identifier('_-_-_-'));
			buildAssertion(assert.deepEqual, "the-id", new L.AST.Identifier('the-id'));
			buildAssertion(assert.deepEqual, "__get__", new L.AST.Identifier('__get__'));
		});
	});
	
	describe ('dictionary productions', function () {
		it ('should accept well-formed dictionaries', function () {
			buildAssertion(assert.deepEqual, "{}", new L.AST.KeyValueList([]));
			buildAssertion(assert.deepEqual, "{a:b}", new L.AST.KeyValueList([
				new L.AST.KeyValuePair(new L.AST.Identifier('a'), new L.AST.Identifier('b'))
			]));
			buildAssertion(assert.deepEqual, "{a:b,}", new L.AST.KeyValueList([
				new L.AST.KeyValuePair(new L.AST.Identifier('a'), new L.AST.Identifier('b'))
			]));
			buildAssertion(assert.deepEqual, "{a: 1, b: 2}", new L.AST.KeyValueList([
				new L.AST.KeyValuePair(new L.AST.Identifier('a'), new L.AST.Integer(1)),
				new L.AST.KeyValuePair(new L.AST.Identifier('b'), new L.AST.Integer(2))
			]));
			buildAssertion(assert.deepEqual, "{a: 1\nb: 2\nc: 3}", new L.AST.KeyValueList([
				new L.AST.KeyValuePair(new L.AST.Identifier('a'), new L.AST.Integer(1)),
				new L.AST.KeyValuePair(new L.AST.Identifier('b'), new L.AST.Integer(2)),
				new L.AST.KeyValuePair(new L.AST.Identifier('c'), new L.AST.Integer(3))
			]));
			buildAssertion(assert.deepEqual, "{a: 1,b:2\nc:3, d :4}", new L.AST.KeyValueList([
				new L.AST.KeyValuePair(new L.AST.Identifier('a'), new L.AST.Integer(1)),
				new L.AST.KeyValuePair(new L.AST.Identifier('b'), new L.AST.Integer(2)),
				new L.AST.KeyValuePair(new L.AST.Identifier('c'), new L.AST.Integer(3)),
				new L.AST.KeyValuePair(new L.AST.Identifier('d'), new L.AST.Integer(4))
			]));
		});
	});

	describe ('list productions', function () {
		it ('should accept well-formed lists', function () {
			buildAssertion(assert.deepEqual, "[]", new L.AST.ExpressionList([]));
			buildAssertion(assert.deepEqual, "[a]", new L.AST.ExpressionList([
				new L.AST.Identifier('a')
			]));
			buildAssertion(assert.deepEqual, "[1, 2, 3]", new L.AST.ExpressionList([
				new L.AST.Integer(1),
				new L.AST.Integer(2),
				new L.AST.Integer(3)
			]));
			buildAssertion(assert.deepEqual, "[a, !a]", new L.AST.ExpressionList([
				new L.AST.Identifier('a'),
				new L.AST.PrefixExpression(
					new L.AST.PrefixOperator('!'),
					new L.AST.Identifier('a')
				)
			]));
		});
	});

	describe ('function productions', function () {
		it ('should accept basic well-formed functions', function () {
			// Possibly want to allow []->[], []->[_], or []->_
			buildAssertion(assert.deepEqual, "[]->[\n_\n]", new L.AST.Function(
				new L.AST.IdentifierList([]), new L.AST.Block(
					new L.AST.Identifier('_')
				)
			));
		});
	});

	describe ('expression productions', function () {
		it ('should accept well-formed prefix expressions', function () {
			buildAssertion(assert.deepEqual, "+a", new L.AST.PrefixExpression(
				new L.AST.PrefixOperator('+'), new L.AST.Identifier('a')
			));
			buildAssertion(assert.deepEqual, "!!a", new L.AST.PrefixExpression(
				new L.AST.PrefixOperator('!'), new L.AST.PrefixExpression(
					new L.AST.PrefixOperator('!'), new L.AST.Identifier('a')
			)));
			buildAssertion(assert.deepEqual, "~0xA", new L.AST.PrefixExpression(
				new L.AST.PrefixOperator('~'), new L.AST.Integer(10)
			));
		});

		it ('should accept well-formed infix expressions', function () {
			buildAssertion(assert.deepEqual, "1 + 2", new L.AST.InfixExpression(
				new L.AST.InfixOperator('+'),
				new L.AST.Integer(1),
				new L.AST.Integer(2)
			));
			buildAssertion(assert.deepEqual, "a:7", new L.AST.InfixExpression(
				new L.AST.InfixOperator(':'),
				new L.AST.Identifier('a'),
				new L.AST.Integer(7)
			));
			// The infix expressions are right associative by default. There will
			// be an associativity & precedence macro that adjusts the AST later.
			buildAssertion(assert.deepEqual, "1 + 2 + 3", new L.AST.InfixExpression(
				new L.AST.InfixOperator('+'),
				new L.AST.Integer(1),
				new L.AST.InfixExpression(
					new L.AST.InfixOperator('+'),
					new L.AST.Integer(2),
					new L.AST.Integer(3)
				)
			));
		});

		it ('should accept well-formed quoted expressions', function () {
			buildAssertion(assert.deepEqual, "|1+2|", new L.AST.Quote(
				new L.AST.InfixExpression(
					new L.AST.InfixOperator('+'),
					new L.AST.Integer(1),
					new L.AST.Integer(2)
				)
			));
			buildAssertion(assert.deepEqual, "|a: {b: c}|", new L.AST.Quote(
				new L.AST.InfixExpression(
					new L.AST.InfixOperator(':'),
					new L.AST.Identifier('a'),
					new L.AST.KeyValueList([
						new L.AST.KeyValuePair(
							new L.AST.Identifier('b'),
							new L.AST.Identifier('c')
						)
					])
				)
			));
			buildAssertion(assert.deepEqual, "| 5 + = a |", new L.AST.Quote(
				new L.AST.InfixExpression(
					new L.AST.InfixOperator('+'),
					new L.AST.Integer(5),
					new L.AST.PrefixExpression(
						new L.AST.PrefixOperator('='),
						new L.AST.Identifier('a')
					)
				)
			));
			buildAssertion(assert.deepEqual, "||a,b||", new L.AST.Quote(
				new L.AST.ExpressionList([
					new L.AST.Identifier('a'),
					new L.AST.Identifier('b')
				])
			));
			buildAssertion(assert.deepEqual, "||\na: 1\nb: 2\n||", new L.AST.Quote(
				new L.AST.ExpressionList([
					new L.AST.InfixExpression(
						new L.AST.InfixOperator(':'),
						new L.AST.Identifier('a'),
						new L.AST.Integer(1)
					),
					new L.AST.InfixExpression(
						new L.AST.InfixOperator(':'),
						new L.AST.Identifier('b'),
						new L.AST.Integer(2)
					)
				])
			));
		});

		it ('should accept well-formed nested infix expressions', function () {
			buildAssertion(assert.deepEqual, "1 + a <= 4 .. {}", new L.AST.InfixExpression(
				new L.AST.InfixOperator('+'),
				new L.AST.Integer(1),
				new L.AST.InfixExpression(
					new L.AST.InfixOperator('<='),
					new L.AST.Identifier('a'),
					new L.AST.InfixExpression(
						new L.AST.InfixOperator('..'),
						new L.AST.Integer(4),
						new L.AST.KeyValueList([])
					)
				)
			));
		});
	});
});

