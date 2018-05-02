const { List, Record } = require('immutable');
const AST = require('./ast');

/*
declaration -> identifier identifier selectorDeclaration '->' block

selectorDeclaration -> MESSAGE[selectorDeclarationPart*]

selectorDeclarationPart -> identifier ':' identifier identifier

invocation -> expression MESSAGE[selectorInvocationPart*]

selectorInvocationPart -> identifier ':' expression


messageSend -> expression '<~'

listAccessor -> expression LIST[expression*]

call -> expression MESSAGE[expression*]

propertyAccessor ->

prefixExpression ->

value -> function
			 | list
			 | dictionary
			 | identifier
			 | text
			 | number
			 | block
			 | parenthesizedExpr
			 | type

function -> idList '->' (BLOCK | function)

idList -> MESSAGE[identifier*]

list -> LIST[expression*]

dictionary -> LIST[keyValuePair*]

keyValuePair -> expression ':' expression

identifier -> IDENTIFIER

text -> TEXT

number -> INTEGER | DECIMAL | SCIENTIFIC | COMPLEX

block -> BLOCK[expression*]

parenthesizedExpr -> EXPRESSION






 */


let match = {
	expression: function(context, node, unparsed) {
		// Match any expression
		// 
        //     expression ::= assignmentExpression
		//                  | typeDeclaration
		//                  | methodDeclaration
        //                  | expressionNoAssign
		//
		let exp = (
			this.assignmentExpression(context, node, unparsed) ||
			this.typeDeclaration(context, node, unparsed) ||
			// this.methodDeclaration(context, node, unparsed) ||
			this.expressionNoAssign(context, node, unparsed)
		);

		if (exp && exp[1].count() > 0) {
			let ret = [new AST.Error({
				message: 'did not consume all tokens',
				consumed: exp[0],
				encountered: exp[1]
			}), List([])];
			return ret;
		} else {
			return exp;
		}
	},

	expressionNoAssign: function(context, node, unparsed) {
		// Match any expression with the exception of assignment expressions
		//
		//     expressionNoAssign -> infixExpression
		//                         | expressionNoInfix
		//
		let exp = (
			this.infixExpression(context, node, unparsed) ||
			this.expressionNoInfix(context, node, unparsed)
		);

		return exp;
	},

	infixExpression: function(context, node, unparsed) {
		// Match an expression consisting of lefthand and righthand sub-
		// expressions joined by an infix operator
		//
        //     infixExpression -> expressionNoInfix OPERATOR expressionNoAssign
		//
		let leftMatch = this.expressionNoInfix(context, node, unparsed);
		let op, terms, rightMatch;

		if (!leftMatch) { return null; }
		[op, terms] = [leftMatch[1].first(), leftMatch[1].rest()];

		// Adding the colon operator to the disallowed list is a nasty hack
		// but I want key value pairs to only be valid in map literals and
		// selector messages.
		let disallowed = List(['::', ':', '!', '~', '.']);

		if (op && op._name === 'Operator' && !disallowed.contains(op.label) && terms.count() > 0) {
			rightMatch = this.expressionNoAssign(context, terms.first(), terms.rest());
			let infixExp;

			if (rightMatch) {
				infixExp = new AST.InfixExpression({
					lhs: leftMatch[0], op: op, rhs: rightMatch[0]
				});
				if (rightMatch._name === 'Error') {
					return [infixExp, List([])];
				} else {
					return [infixExp, rightMatch[1]];
				}
			}
		}

		return null;
	},

	expressionNoInfix: function(context, node, unparsed) {
		// Match any expression that is not an `infixExpression`
		//
        //     expressionNoInfix -> declaration
        //                        | messageSend
        //                        | listAccessor
        //                        | call
        //                        | propertyAccessor
        //                        | prefixExpression
        //                        | value
		//
		let pfxMatch = this.prefixExpression(context, node, unparsed);
		if (pfxMatch) { return pfxMatch; }

		var expr = this.value(context, node, unparsed);
		if (!expr) { return null; }

		var target = expr;

		while (expr) {
			// We need to explicitly test for compound expressions. They are
			// property lookup (`struct.property`), function or method invocation
			// (`func(value)`), and collection interrogation (`list[index]`)
			// Chaining operations in any order (`func(value)[index].property`)
			// is permitted. Compound expressions are left associative
			let [next, rest] = [expr[1].first(), expr[1].rest()];
			expr = null;

			if (next) {
				//console.log('next: ' + next);
				if (next._name === 'Operator' && next.label === '.') {
					//console.log('operator');
					let ident = this.identifier(context, rest.first(), rest.rest());

					expr = ident && [
						new AST.PropertyLookup({target: target[0], term: ident[0]}),
						ident[1]
					];
				} else if (next._name === 'Message') {
					let message = this.parameterList(context, next, rest);
					//console.log('message: ' + message[0]);
					expr = message && [
						new AST.FunctionCall({target: target[0], args: message[0]}),
						message[1]
					];
				} else if (next._name === 'List') {
					//console.log('list');
					let lookup = this.list(context, next, rest);

					expr = lookup && [
						new AST.Accessor({target: target[0], terms: lookup[0].items}),
						lookup[1]
					];
				}
			}
			//console.log('target: ' + target[0]);
			//console.log('expr:   ' + (expr && expr[0]));
			if (expr) {
				//console.log('expr: ' + expr[0]);
				// If we found a clarification operation, we assign it to target.
				// If there was no match, target remains the previous value, and
				// we break out of the while loop and return the previous value.
				target = expr;
			}
		}

		return target;
	},

	identifierList: function(context, node, unparsed) {
		// Match a list of identifiers
		//
		//     identifierList -> 
		if (node._name === 'Message') {
			let idents = [];

			for (let expr of node.exprs) {
				let terms = expr.terms;
				let first = this.identifier(context, terms.first(), terms.rest());
				let second;

				if (!first) {
					idents.push(new AST.Error({
						message: 'Encountered unexpected term',
						consumed: null,
						encountered: terms
					}));
					break;
				}

				if (first[1].count() > 0) {
					second = this.identifier(context, first[1].first(), first[1].rest());
				}

				if (second) {
					if (second[1].count() > 0) {
						// Didn't consume all tokens...
						idents.push(new AST.Error({
							message: 'Encountered unexpected term',
							consumed: second[0],
							encountered: second[1]
						}));
					}
					idents.push(second[0].setIn(['tags', 'type'], first[0].label));
				} else {
					idents.push(first[0]);
				}
			}

			return [new AST.IdentifierList({items: List(idents)}), unparsed];
		}

		return null;
	},

	parameterList: function(context, node, unparsed) {
		if (node._name === 'Message') {
			let exprs = [];

			for (let expr of node.exprs) {
				let exp = this.expressionNoAssign(context, expr.terms.first(), expr.terms.rest());

				if (exp && exp[1].count() === 0) { exprs.push(exp[0]); }
				else { return null; }
			}

			return [new AST.List({items: List(exprs)}), unparsed];
		}

		return null;
	},

	assignmentExpression: function(context, node, unparsed) {
		// Matches assignment expressions
		//
		//     assignmentExpression ::= template Operator(::) expressionNoAssign
		//
		let dest = this.template(context, node, unparsed);
		if (!dest) { return null; }

		let [op, rest] = [dest[1].first(), dest[1].rest()];
		if (op && op._name === 'Operator' && op.label === '::' && rest.count() > 0) {
			let source = this.expressionNoAssign(context, rest.first(), rest.rest());

			if (source) {
				return [new AST.Assignment({template: dest[0], value: source[0]}), source[1]];
			}
		}

		return null;
	},

	typeDeclaration: function(context, node, unparsed) {
		// Matches a type declaration
		//
		//     typeDeclaration ::= identifier recordType
		//                       | identifier unionType
		//
		// A quick primer on type declarations:
		//
		// - The most basic type declaration is the unit type, or a 0-tuple
		//     `Unit << >>`
		//
		// - The unit type has one value
		//     ```
		//     u :: Unit()
		//     v :: Unit()
		//     u == v      # .True
		//     ```
		//
		// - A record type is a named, ordered collection of fields
		//     `Point << Integer x, Integer y >>
		//
		// - An instance of a record type may be instantiated by ___
		//     ```
		//     p1 :: Point(x: 3, y: 5)
		//     p2 :: Point(7, 4)
		//
		// - A union type consists of two or more variants, separated by `|`
		//     `Boolean << True | False >>`
		//
		// - A union's variants may be accessed with the dot operator
		//     ```
		//     Boolean p :: .True
		//     q :: Boolean.False
		//     ```
		//
		// - A union variant may have a list of associated values
		//     ```
		//     Color << RGB(Integer, Integer, Integer)
		//            | CMYK(Decimal, Decimal, Decimal, Decimal) >>
		//     ```
		//
		// - Associated values may be instantiated by __
		//     ```
		//     redColor :: Color.RGB(255, 0, 0)
		//     cyanColor :: Color.CMYK(1.0, 0.0, 0.0, 0.0)
		//     ```
		let ident = this.identifier(context, node, unparsed);
		if (!(ident && ident[1].count() > 0)) { return null; }

		let [first, rest] = [ident[1].first(), ident[1].rest()];

		let type = (
			this.recordType(context, first, rest) ||
			this.unionType(context, first, rest)
		);
		
		return type && [type[0].set('label', ident[0]), type[1]];
	},

	recordType: function(context, node, unparsed) {
		// Match a record type declaration
		//
		//     recordType ::= TYPE[ (identifier identifier?)* ]
		//
		if (node._name === 'Type') {
			let members = [];
			for (let expr of node.exprs) {
				let first = this.identifier(context, expr.terms.first(), expr.terms.rest());
				let second;

				if (!first) {
					return null;
				}

				if (first[1].count() > 0) {
					second = this.identifier(context, first[1].first(), first[1].rest());

					if (!second) {
						return null;
					}
				}

				if (second) {
					if (second[1].count() > 0) {
						// Didn't consume all tokens...
						return null;
					}
					members.push(second[0].setIn(['tags', 'type'], first[0].label));
				} else {
					members.push(first[0]);
				}
			}
			return [new AST.Record({members: List(members)}), unparsed];
		}
		return null;
	},

	unionType: function(context, node, unparsed) {
		// Matches a union type literal
		//
		//     unionType ::= TYPE[ variant ( Operator('|') variant )* ]
		//
		//     variant ::= identifier
		//               | identifier LIST[ Identifier + ]
		//
		if (node._name === 'Type') {
			if (node.exprs.count() !== 1) {
				return null;
			}

			let expr = node.exprs.first();

			var cont = false;
			var variants = List([]);

			for (let term of expr.terms) {
				if (cont && term._name === 'Message') {
					// Parse the identifiers in the message
					let values = term.exprs.reduce(function(vs, v) {
						if (!(vs instanceof List)) {
							return vs;
						} else if (v._name === 'Expression' && v.terms.count() === 1) {
							let ident = v.terms.first();
							if (ident._name === 'Identifier') {
								return vs.push(ident);
							} else {
								return new AST.Error();
							}
						} else {
							return new AST.Error();
						}
					}, List([]));

					if (values instanceof List) {
						variants = variants.update(-1, function(v) {
							return v.set('values', values);
						});
					} else {
						return values;
					}
				} else if (cont && term._name === 'Operator' && term.label === '|') {
					cont = false;
				} else if (!cont && term._name === 'Identifier') {
					cont = true;
					variants = variants.push(new AST.Variant({label: term.label}));
				} else {
					return new AST.Error({
						message: 'Encountered unexpected node'
					});
				}
			}

			if (variants.count() >= 2) {
				return [new AST.Union({variants: List(variants)}), unparsed];
			} else {
				return null;
			}
		}
		return null;
	},

	template: function(context, node, unparsed) {
		// Matches an assignment destination structure
		//
		//     template -> list
		//               | map
		//               | block
		//               | templatePart
		//
		// Assignment expressions in L destructure the source expression to
		// allow some basic pattern matching functionality.
		// Lists			 `[Function a, Integer b, Integer c...]`
		// Maps              `[a: b, $c: d, e...]`
		// Blocks            `{exp..., ret}`
		// Functions		 `(a, b, c...) -> block` or `(a, b) -> { exps... }`
		// Scalar literals   `'text'`, `123.45`, `$symbol`
		//
		// What about nesting? Are any of the following allowed?
		// `[a, [b, c], d...]`
		// `[(a...) -> b, (Integer c) -> { ..., Integer d }]`
		//
		// What about infix expressions? This gets super tricky.
		// `a + b :: 1 + 2` => `[$a: 1, $b: 2]`
		// `a :: { 1 + 2 }` => `[$a: { 1 + 2 }]`
		// `a.exprs(last)`  => `MessageSend(target: 1, message:('+': 2))`

		// [BB 2017-08-12]: Currently templates support lists, maps, and blocks
		if (node._name === 'List') {
			// If the template is a List or Block, treat each expr as a template.
			let parts = [];

			for (let exp of node.exprs) {
				// N.B.: If we don't want to allow nesting, just change
				// `this.template` to `this.templatePart`.
				let part = this.template(context, exp.terms.first(), exp.terms.rest());

				if (part && part[1].count() > 0) {
					parts.push(new AST.Error({
						message: '',
						consumed: part[0],
						encountered: part[1]
					}));
				} else if (part) {
					parts.push(part[0].match);
				} else {
					return null;
				}
			}

			return [new AST.Template({
				match: new AST.List({items: List(parts)})
			}), unparsed];
		} else if (node._name === 'Block') {
			let parts = [];

			for (let exp of node.exprs) {
				let part = this.template(context, exp.terms.first(), exp.terms.rest());

				if (part && part[1].count() > 0) {
					parts.push(new AST.Error({
						message: '',
						consumed: part[0],
						encountered: part[1]
					}));
				} else if (part) {
					parts.push(part[0].match);
				} else {
					return null;
				}
			}

			return [new AST.Template({
				match: new AST.Block({exprs: List(parts)})
			}), unparsed];
		} else {
			// Otherwise, we look for a template part.
			let template = this.templatePart(context, node, unparsed);
			return template && [new AST.Template({
				match: template[0]
			}), template[1]];
		}

		return null;
	},

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
	templatePart: function (context, node, unparsed) {
		// Matches an identifier or scalar literal in a template
		//
		//     templatePart -> [identifier] identifier
		//                   | symbol
		//                   | text
		//                   | integer
		//                   | decimal
		//                   | scientific
		//                   | complex
		//
		// TODO: in __future__, allow identifiers to have eager override
		//	   to pin their evaluated value...
		let first = (
			this.identifier(context, node, unparsed) ||
			this.symbol(context, node, unparsed) ||
			this.text(context, node, unparsed) ||
			this.integer(context, node, unparsed) ||
			this.decimal(context, node, unparsed) ||
			this.scientific(context, node, unparsed) ||
			this.complex(context, node, unparsed)
		);

		if (first && first[0]._name === 'Identifier' && first[1].count() > 0) {
			let second = this.identifier(context, first[1].first(), first[1].rest());
			let remainder = second && second[1] || first[1];

			let oper = remainder.first();
			let ident;

			if (second) {
				ident = second[0].setIn(['tags', 'type'], first[0].label);
			} else {
				ident = first[0];
			}

			if (oper && oper._name === 'Operator' && oper.label === '...') {
				return [ident.setIn(['tags', 'collect'], true), remainder.rest()];
			} else {
				return [ident, remainder];
			}
		} else {
			return first;
		}
	},

	prefixExpression: function(context, node, unparsed) {
		// Match a prefix expression
		//
		//     prefixExpression -> operator value
		//
		const prefixOperators = List(['+', '-', '!', '~', '^', '\\']);
		if (node._name !== 'Operator' || !prefixOperators.contains(node.label)) { return null; }

		let exp = this.value(context, unparsed.first(), unparsed.rest());

		if (exp && node.label === '\\') {
			//console.log(exp[0]);
			//console.log(exp[1]);
			return [new AST.Evaluate({target: exp[0]}), exp[1]];
		} else if (exp) {
			return [new AST.PrefixExpression({op: node, expr: exp[0]}), exp[1]];
		} else {
			return null;
		}
	},

	value: function(context, node, unparsed) {
		// Match a value
		//
		//     value -> block | matchDefn | record | functionDefn | identifier
		//            | symbol | parenthesized | map | list | text | integer
		//            | decimal | scientific | complex
		//
		if (node._name === 'Block') {
			if (node.getIn(['tags', 'envelopeShape']) === '{}') {
				// Regular ol' block. Recursively descend and build the context.
				return [node.transform(context, this), unparsed];
			} else if (node.getIn(['tags', 'envelopeShape']) === '{{}}') {
				// Pattern matching function. Parse each 
				return this.matchDefn(context, node, unparsed);
			}
		}

		let match = (
			//this.option(context, node, unparsed) ||
			//this.record(context, node, unparsed) ||
			this.functionDefn(context, node, unparsed) ||
			this.identifier(context, node, unparsed) ||
			this.symbol(context, node, unparsed) ||
			this.parenthesized(context, node, unparsed) ||
			this.map(context, node, unparsed) ||
			this.list(context, node, unparsed) ||
			this.text(context, node, unparsed) ||
			this.integer(context, node, unparsed) ||
			this.decimal(context, node, unparsed) ||
			this.scientific(context, node, unparsed) ||
			this.complex(context, node, unparsed)
		);

		return match;
	},

	parenthesized: function(context, node, unparsed) {
		// Match a parenthesized expression
		//
		//     parenthesized -> '(' expressionNoAssign ')'
		//
		if (node._name === 'Message') {
			let [first, rest] = [node.exprs.first(), node.exprs.rest()];

			if (node.exprs.count() > 1) {
				// TODO: this drops the comma because reasons
				return [new AST.Grouping({
					expr: new AST.Error({
						message: '',
						consumed: first,
						encountered: rest
					})
				}), List([])];
			}

			let expr = this.expressionNoAssign(context, first.terms.first(), first.terms.rest());
			//TODO: add error if there's unparsed?
			return [new AST.Parenthesized({expr: expr[0]}), unparsed];
		}

		return null;
	},

	matchDefn: function(context, node, unparsed) { // TODO: this doesn't compose with fns
		// Matches a pattern match definition
		//
		//     matchDefn -> 
		if (node._name === 'Block' &&
				node.getIn(['tags', 'envelopeShape']) === '{{}}') {
			let funcs = [];

			for (let expr of node.exprs) {
				let fn = this.functionDefn(context, expr.terms.first(), expr.terms.rest());
				if (fn && fn[1].count() === 0) {
					funcs.push(fn[0]);
				} else if (fn) {
					funcs.push(new AST.Error({
						message: 'did not consume all tokens',
						consumed: fn[0],
						encountered: fn[0]
					}));
				} else {
					return null;
				}
			}

			return [new AST.Match({predicates: funcs}), unparsed];
		} else {
			return null;
		}
	},

	functionDefn: function(context, node, unparsed) {
		// Matches a function definition
		//
		//     functionDefn ::= idList functionBody
		//
		if (node._name === 'Message') {
			node._name = 'List';
		} else if (node._name !== 'List') {
			return null;
		}

		let idList = this.template(context, node, unparsed);
		if (!(idList && idList[1].count() > 0)) { return null; }

		let [first, rest] = [idList[1].first(), idList[1].rest()];
		let body = this.functionBody(context, first, rest);

		if (!body) { return null; }
		return [
			new AST.Function({template: idList[0], block: body[0]}),
			body[1]
		];
	},

	functionBody: function(context, node, unparsed) {
		// Match a function body
		//
		//     functionBody -> operator('->') block
		//                   | operator('->') functionDefn
		//
		if (node._name !== 'Operator' || node.label !== '->') {
			return null;
		}

		let [first, rest] = [unparsed.first(), unparsed.rest()];
		let block;

		if (first._name === 'Block') {
			block = [first.transform(context, this), rest];
		} else {
			block = this.functionDefn(context, first, rest);
		}

		return block;
	},

	list: function(context, node, unparsed) {
		// Match a list literal
		//
		//     list -> LIST[ expressionNoAssign* ]
		//
		if (node._name === 'List') {
			let exprs = [];

			if (node.exprs.count() === 0) {
				return [new AST.List({items: List([])}), unparsed];
			}

			for (let expr of node.exprs) {
				let exp = this.expressionNoAssign(context, expr.terms.first(), expr.terms.rest());

				if (exp && exp[1].count() === 0) {
					exprs.push(exp[0]);
				} else {
					return null;
				}
			}

			return [new AST.List({items: List(exprs)}), unparsed];
		}

		return null;
	},

	map: function(context, node, unparsed) {
		// Matches a map literal
		//
		//     map -> LIST[ (expressionNoInfix Operator(':') expressionNoAssign)* ]
		//          | LIST[ Operator(':') ]
		//
		if (node._name === 'List') {
			let kvps = [];

			if (node.exprs.count() === 1
					&& node.exprs.first().terms.count() === 1) {
				let op = node.exprs.first().terms.first();
				if (op._name === 'Operator' && op.label === ':') {
					return [new AST.Map({items: List([])}), unparsed];
				} else {
					return null;
				}
			} else if (node.exprs.count() === 0) {
				return null;
			}

			for (let expr of node.exprs) {
				let key = this.expressionNoInfix(context, expr.terms.first(), expr.terms.rest());

				if (key) {
					let [first, rest] = [key[1].first(), key[1].rest()];
					
					if (first && first._name === 'Operator' && first.label === ':') {
						let val = this.expressionNoAssign(context, rest.first(), rest.rest());
						kvps.push(new AST.KeyValuePair({key: key[0], val: val[0]}));
					} else {
						/*
							[ a : 1 ]
							  ^ ^ ^
							  | | +---- Expression			   1
							  | +------ Operator			   :
							  +-------- Non-Infix Expression   a
							[ a + 1 ]
							  ^ ^ ^
							  | | +---- Expression			   1
							  | +------ Operator			   +
							  +-------- Non-Infix Expression   a
						*/
						// We started parsing *something* but it's not what the map rule
						// was expecting. Backtrack.
						return null;
					}
				} else {
					// If we didn't find an expressionNoInfix, it may be because
					// we're actually in a list and have to backtrack.
					return null;
				}
			}
			return [new AST.Map({items: List(kvps)}), unparsed];
		}

		return null;
	},

	identifier: function(context, node, unparsed) {
		// Matches an identifier
		//
		//     identifier -> [a-zA-Z_] [a-zA-Z0-9_-]* postfixModifier?
		//
		//     postfixModifier -> [?!]
		//
		if (node._name === 'Identifier') {
			return [node, unparsed];
		} else {
			return null;
		}
	},

	symbol: function(context, node, unparsed) {
		// Matches a symbol
		//
		//     symbol -> '$' [a-zA-Z_] [a-zA-Z0-9_-]*
		//
		if (node._name === 'Symbol') {
			return [node, unparsed];
		} else {
			return null;
		}
	},

	text: function(context, node, unparsed) {
		// Matches a text value
		//
		//     text -> TEXT
		//
		if (node._name === 'Text') {
			return [node, unparsed];
		} else {
			return null;
		}
	},

	integer: function(context, node, unparsed) {
		// Matches an integer value
		//
		//     integer -> DIGIT+
		//
		if (node._name === 'Integer') {
			return [node, unparsed];
		} else {
			return null;
		}
	},

	decimal: function(context, node, unparsed) {
		// Matches a decimal value
		//
		//     decimal -> DIGIT+ '.' DIGIT*
		//
		if (node._name === 'Decimal') {
			return [node, unparsed];
		} else {
			return null;
		}
	},

	scientific: function(context, node, unparsed) {
		// Matches a numeric value in scientific notation
		//
		//     scientific -> integer [eE] [+-]? integer
		//                 | decimal [eE] [+-]? integer
		//
		if (node._name === 'Scientific') {
			return [node, unparsed];
		} else {
			return null;
		}
	},

	complex: function(context, node, unparsed) {
		// Matches a complex value
		//
		//     complex -> integer [+-] imaginary
		//              | decimal [+-] imaginary
		//
		//     imaginary -> integer [ijJ]
		//                | decimal [ijJ]
		//
		if (node._name === 'Complex') {
			return [node, unparsed];
		} else {
			return null;
		}
	},
};

module.exports = match;
