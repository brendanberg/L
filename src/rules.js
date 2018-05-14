const { Map, List, Record } = require('immutable');
const AST = require('./ast');
const Skeleton = require('./skeleton'); // For nasty function defn hack


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
			this.methodDeclaration(context, node, unparsed) ||
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
		//     expressionNoAssign ::= infixExpression
		//                          | expressionNoInfix
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
		//     infixExpression ::= expressionNoInfix OPERATOR expressionNoAssign
		//
		let leftMatch = this.expressionNoInfix(context, node, unparsed);
		let op, terms, rightMatch;

		if (!leftMatch) { return null; }
		[op, terms] = [leftMatch[1].first(), leftMatch[1].rest()];

		// The double colon operator is only permitted in assignment
		// expressions; the single colon operator is only permitted in map
		// literals and messages with named parameters. The dot operator is
		// handled in the lookup rule of `expressionNoInfix`, and the
		// exclamation and tilde oprators are only permitted as prefix ops.
		let disallowed = List(['::', ':', '!', '~', '.']);

		if (op && op._name === 'Operator' && !disallowed.contains(op.label)
														&& terms.count() > 0) {

			rightMatch = this.expressionNoAssign(context, terms.first(), terms.rest());
			let infixExp;

			if (rightMatch) {
				if (rightMatch[0]._name === 'InfixExpression') {
					// The grammar definition requires the lefthand side of an
					// infix expression to be an `expressionNoInfix` to avoid
					// left recursion. In order to have infix expressions be
					// left associative by default, we rebalance the AST as we
					// parse, converting the tree illustrated in figure (1)
					// into the one shown in figure (2)
					//
					// (1)                   (2)
					//        +                       *
					//       / \                     / \
					//      a   *                   +   c
					//         / \                 / \
					//        b   c               a   b
					//
					let rightExp = rightMatch[0];

					infixExp = rightExp.set('lhs', new AST.InfixExpression({
						lhs: leftMatch[0], op: op, rhs: rightMatch[0].lhs
					}));
				} else {
					infixExp = new AST.InfixExpression({
						lhs: leftMatch[0], op: op, rhs: rightMatch[0]
					});
				}

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
		//     expressionNoInfix ::= call (invocation)
		//                         | lookup
		//                         | accessor
		//                         | prefixExpression
		//                         | value
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
				if (next._name === 'Qualifier') {
					expr = [
						new AST.Lookup({target: target[0], term: next}),
						rest
					];
				} else if (next._name === 'Message') {
					let message = (
						this.namedParameterList(context, next, rest) ||
						this.positionalParameterList(context, next, rest) ||
						this.qualifierMessage(context, next, rest)
					);

					if (message && message[0].getIn(['tags', 'messageType']) === 'named') {
						expr = [
							new AST.Invocation({target: target[0], plist: message[0].items}),
							message[1]
						];
					} else if (message) {
						expr = [
							new AST.FunctionCall({target: target[0], args: message[0]}),
							message[1]
						];
					} else {
						expr = null;
					}
				} else if (next._name === 'List') {
					let lookup = this.list(context, next, rest);

					expr = lookup && [
						new AST.Accessor({target: target[0], terms: lookup[0].items}),
						lookup[1]
					];
				}
			}

			if (expr) {
				// If we found a clarification operation, we assign it to target.
				// If there was no match, target remains the previous value, and
				// we break out of the while loop and return the previous value.
				target = expr;
			}
		}

		return target;
	},

	qualifierMessage: function(context, node, unparsed) {
		// Matches a message containing a qualifier which is a special form
		// to allow zero-argument method calls
		//
		//     qualifierMessage ::= MESSAGE[ qualifier ]
		//
		if (node._name === 'Message') {
			let [first, rest] = [node.exprs.first(), node.exprs.rest()];

			if (!first || rest.count() !== 0) { return null; }

			let qualifier = this.qualifier(context, first.terms.first(), first.terms.rest());

			if (qualifier && qualifier[1].count() === 0) {
				return [
					new AST.List({items: List(qualifier), tags: Map({messageType: 'named'})}),
					rest
				];
			}
		}

		return null;
	},

	namedParameterList: function(context, node, unparsed) {
		// Matches a list of named parameters for a method invocation
		// 
		//     namedParameterList ::= MESSAGE[ namedParameterPart+ ]
		//
		if (node._name === 'Message') {
			let self = this;
			let exprs = node.exprs.reduce(function(result, expr) {
				if (!result) { return null; }

				let [first, rest] = [expr.terms.first(), expr.terms.rest()];
				let exp = self.namedParameterPart(context, first, rest);

				if (!(exp && exp[1].count() === 0)) {
					return null;
				}

				return result.push(exp[0]);
			}, List([]));

			if (exprs && exprs.count() > 0) {
				return [
					new AST.List({items: exprs, tags: Map({messageType: 'named'})}),
					unparsed
				];
			}
		}

		return null;
	},

	positionalParameterList: function(context, node, unparsed) {
		// Matches a list of expressions to be evaluated for a function call
		//
		//     positionalParameterList ::= MESSAGE[ expressionNoAssign* ]
		//
		if (node._name === 'Message') {
			let self = this;
			let exprs = node.exprs.reduce(function(result, expr) {
				if (!result) { return null; }

				let [first, rest] = [expr.terms.first(), expr.terms.rest()];
				let exp = self.expressionNoAssign(context, first, rest);

				if (!(exp && exp[1].count() === 0)) {
					return null;
				}

				return result.push(exp[0]);
			}, List([]));

			if (exprs) {
				return [
					new AST.List({items: exprs, tags: Map({messageType: 'positional'})}),
					unparsed
				];
			}
		}

		return null;
	},

	namedParameterPart: function(context, node, unparsed) {
		// Matches a named parameter to a function
		//
		//     namedParameterPart ::= name OPERATOR[':'] expressionNoInfix
		//

		let ident = this.identifier(context, node, unparsed);
		if (!(ident && ident[0].modifier === null)) {
			return null;
		}

		let [op, rest] = [ident[1].first(), ident[1].rest()];
		if (op && op._name === 'Operator' && op.label === ':' && rest.count() > 0) {
			let expr = this.expressionNoAssign(context, rest.first(), rest.rest());

			if (expr && expr[1].count() > 0) {
				return null;
			}

			return expr && [new AST.KeyValuePair({key: ident[0], val: expr[0]}), List([])];
		}

		return null;
	},

	assignmentExpression: function(context, node, unparsed) {
		// Matches assignment expressions
		//
		//     assignmentExpression ::= template OPERATOR['::'] expressionNoAssign
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
		
		return type && [type[0].set('label', ident[0].label), type[1]];
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
		//     unionType ::= TYPE[ variant ( OPERATOR['|'] variant )* ]
		//
		//     variant ::= qualifier | qualifier LIST[ Identifier + ]
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
				} else if (!cont && term._name === 'Qualifier') {
					cont = true;
					variants = variants.push(new AST.Variant({label: term.label}));
				} else {
					return new AST.Error({
						message: 'Encountered unexpected node'
					});
				}
			}

			if (variants.count() >= 2) {
				return [
					new AST.Union({
						variants: Map(variants.map(function(v) {
							return [v.label, v];
						}))
					}),
					unparsed
				];
			} else {
				return null;
			}
		}
		return null;
	},

	methodDeclaration: function(context, node, unparsed) {
		//
		//     methodDeclaration ::=
		//             identifier identifier selector OPERATOR['->'] functionBody
		//
		if (node._name !== 'Identifier' || unparsed.count() < 3) { return null; }

		let name = this.identifier(context, unparsed.first(), unparsed.rest());
		if (!(name && name[1].count() > 0)) { return null; }

		let selector = (
			this.selector(context, name[1].first(), name[1].rest()) ||
			this.unarySelector(context, name[1].first(), name[1].rest())
		);

		if (!(selector && selector[1].count() > 0)) { return null; }

		let op = this.operator(context, selector[1].first(), selector[1].rest());

		if (!(op && op[0].label === '->')) { return null; }

		let body = this.functionBody(context, op[1].first(), op[1].rest());

		if (!body) { return null; }

		return [
			new AST.Method({
				target: name[0].setIn(['tags', 'type'], node.label),
				selector:selector[0],
				block: body[0]
			}),
			body[1]
		];
	},

	selector: function(context, node, unparsed) {
		//
		//     selector ::= MESSAGE[ selectorPart * ]
		//
		//     selectorPart ::= identifier OPERATOR[':'] identifier? identifier
		//
		if (node._name !== 'Message') { return null; }

		let self = this;
		let parts = node.exprs.reduce(function(result, expr) {
			if (result === null) { return null; }

			let id = (
				self.identifier(context, expr.terms.first(), expr.terms.rest()) ||
				self.text(context, expr.terms.first(), expr.terms.rest())
			);

			if (!(id && id[1].count() > 1)) { return null; }

			let op = self.operator(context, id[1].first(), id[1].rest());
			if (!(op && op[0].label === ':')) { return null; }

			let first = self.identifier(context, op[1].first(), op[1].rest());
			let name;

			if (!(first && first[1].count() < 2)) {
				return null;
			} else if (first[1].count() === 1) {
				let second = self.identifier(context, first[1].first(), first[1].rest());
				if (!second) {
					return null;
				} else {
					name = first[0].setIn(['tags', 'type'], second[0].label);
				}
			} else {
				name = first[0];
			}

			return result.push(new AST.KeyValuePair({key: id[0], val: name}));
		}, List([]));

		return parts && [parts, unparsed];
	},

	unarySelector: function(context, node, unparsed) {
		if (node._name !== 'Message') { return null; }

		let self = this;
		let parts = node.exprs.reduce(function(result, expr) {
			if (result === null) { return null; }

			let qual = (
				self.text(context, expr.terms.first(), expr.terms.rest()) ||
				self.qualifier(context, expr.terms.first(), expr.terms.rest())
			);

			if (!(qual && qual[1].count() === 0)) { return null; }

			return result.push(qual[0]);
		}, List([]));

		return parts && [parts, unparsed];
	},

	template: function(context, node, unparsed) {
		// Matches an assignment destination structure
		//
		//     template ::= list
		//                | map
		//                | block
		//                | templatePart
		//
		// Assignment expressions in L destructure the source expression to
		// allow some basic pattern matching functionality.
		// Lists			 `[Function a, Integer b, Integer c...]`
		// Maps              `[$x: a, $y: b, c...]`
		// Blocks            `{exprs..., ret}`
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

	templatePart: function (context, node, unparsed) {
		// Matches an identifier or scalar literal in a template
		//
		//     templatePart ::= [identifier] identifier
		//                    | symbol
		//                    | text
		//                    | integer
		//                    | decimal
		//                    | scientific
		//                    | complex
		//
		let first = (
			this.identifier(context, node, unparsed) ||
			this.symbol(context, node, unparsed) ||
			this.templateVariant(context, node, unparsed) ||
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

	templateVariant: function(context, node, unparsed) {
		// Match an unqualified variant fragment
		//
		//     templateVariant ::= qualifier MESSAGE[ Identifier + ]
		//
		if (node._name !== 'Qualifier') { return null; }

		let values = [];

		if (unparsed.count() > 0) {
			let message = unparsed.first();

			if (message._name === 'Message') {
				for (let expr of message.exprs) {
					let part = this.templatePart(context, expr.terms.first(), expr.terms.rest());

					if (part && part[1].count() === 0) {
						values.push(part[0]);
					} else if (part) {
						values.push(new AST.Error({
							message: 'did not consume all tokens',
							consumed: part[1],
							encountered: part[0]
						}));
					} else {
						console.log('this is a parse error @ match.templateVariant');
						return null;
					}
				}
			}
		}

		return [
			new AST.Variant({label: node.label, values: List(values)}),
			(values.length) ? unparsed.rest() : unparsed
		];
	},

	prefixExpression: function(context, node, unparsed) {
		// Match a prefix expression
		//
		//     prefixExpression ::= operator value
		//
		const prefixOperators = List(['+', '-', '!', '~', '^', '\\']);
		if (node._name !== 'Operator' || !prefixOperators.contains(node.label)) { return null; }

		let exp = this.value(context, unparsed.first(), unparsed.rest());

		if (exp && node.label === '\\') {
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
		//     value ::= block | matchDefn | functionDefn | identifier | symbol
		//             | parenthesized | map | list | text | integer | decimal
		//             | scientific | complex
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
		//     parenthesized ::= MESSAGE[ expressionNoAssign ]
		//
		if (node._name === 'Message' && node.getIn(['tags', 'specialForm']) == true) {
			let skelExpr = node.exprs.first();
			let [first, rest] = [skelExpr.terms.first(), skelExpr.terms.rest()];
			let expr = this.expressionNoAssign(context, first, rest);
			//TODO: add error if there's unparsed?

			if (expr[1].count() > 0) {
				return [new AST.Error({
					message: 'did not consume all tokens',
					consumed: expr[0],
					encountered: expr[1]
				}), unparsed];
			}

			return [new AST.Grouping({expr: expr[0]}), unparsed];
		}
		return null;
	},

	matchDefn: function(context, node, unparsed) { // TODO: this doesn't compose with fns
		// Matches a pattern match definition
		//
		//     matchDefn ::= MATCHLIST[ functionDefn + ]
		//
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
		//     functionDefn ::= idList OPERATOR['->'] guard? functionBody
		//
		if (node._name !== 'Message') {
			return null;
		}

		// Parsing a template requires a `List` rather than a `Message`
		// skeleton node, so we create the List node here.
		// TODO: Update the `template` match function to also take `Message` nodes
		let listNode = new Skeleton.List({
			exprs: node.exprs,
			tags: node.tags
		});

		let idList = this.template(context, listNode, unparsed);
		if (!(idList && idList[1].count() > 0)) { return null; }

		let op = this.operator(context, idList[1].first(), idList[1].rest());
		if (!(op && op[0].label === '->')) { return null; }

		let guard = this.guard(context, op[1].first(), op[1].rest());
		let first, rest;

		if (guard) {
			[first, rest] = [guard[1].first(), guard[1].rest()];
		} else {
			[first, rest] = [op[1].first(), op[1].rest()];
		}

		let body = this.functionBody(context, first, rest);

		if (!body) { return null; }
		return [
			new AST.Function({
				template: idList[0], block: body[0], guard: (guard && guard[0])
			}),
			body[1]
		];
	},

	functionBody: function(context, node, unparsed) {
		// Match a function body
		//
		//     functionBody ::= block
		//                    | functionDefn
		//                    | matchDefn
		//
		let block;

		if (node._name === 'Block' && node.getIn(['tags', 'envelopeShape']) === '{}') {
			block = [node.transform(context, this), unparsed];
		} else {
			block = (this.functionDefn(context, node, unparsed) ||
				this.matchDefn(context, node, unparsed));
		}

		return block;
	},

	guard: function(context, node, unparsed) {
		// Match a guard clause
		//
		//     guard ::= parenthesized OPERATOR['??']
		//
		let expr = this.parenthesized(context, node, unparsed);
		if (!(expr && expr[1].count() > 1)) { return null; }

		let op = this.operator(context, expr[1].first(), expr[1].rest());
		if (!(op && op[0].label === '??')) { return null; }

		return [expr[0], op[1]];
	},

	list: function(context, node, unparsed) {
		// Match a list literal
		//
		//     list ::= LIST[ expressionNoAssign * ]
		//
		if (node._name === 'List' && node.getIn(['tags', 'envelopeShape']) === '[]') {
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
		//     map ::= LIST[ (expressionNoInfix OPERATOR[':'] expressionNoAssign) * ]
		//           | LIST[ OPERATOR[':'] ]
		//
		if (node._name === 'List') {
			let kvps = [];

			if (node.exprs.count() === 1
					&& node.exprs.first().terms.count() === 1) {
				let op = node.exprs.first().terms.first();
				if (op._name === 'Operator' && op.label === ':') {
					return [new AST.Map({items: Map({})}), unparsed];
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
			let items = Map(kvps.map(function(kvp) { return [kvp.key, kvp]; }));
			return [new AST.Map({items: items}), unparsed];
		}

		return null;
	},

	operator: function(context, node, unparsed) {
		// Matches an operator
		//
		//     operator ::= '+' | '-' | '*' | '/' | ...
		//
		if (node._name === 'Operator') {
			return [node, unparsed];
		} else {
			return null;
		}
	},

	identifier: function(context, node, unparsed) {
		// Matches an identifier
		//
		//     identifier ::= [a-zA-Z_] [a-zA-Z0-9_-]* postfixModifier?
		//
		//     postfixModifier ::= [?!]
		//
		if (node._name === 'Identifier') {
			return [node, unparsed];
		} else {
			return null;
		}
	},

	qualifier: function(context, node, unparsed) {
		// Matches a qualifier
		//
		//     qualifier ::= '.' [a-zA-Z0-9_-]+
		//
		if (node._name === 'Qualifier') {
			return [node, unparsed];
		} else {
			return null;
		}
	},

	symbol: function(context, node, unparsed) {
		// Matches a symbol
		//
		//     symbol ::= '$' [a-zA-Z_] [a-zA-Z0-9_-]*
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
		//     text ::= TEXT
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
		//     integer ::= DIGIT+
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
		//     decimal ::= DIGIT+ '.' DIGIT*
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
		//     scientific ::= integer [eE] [+-]? integer
		//                  | decimal [eE] [+-]? integer
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
		//     complex ::= integer [+-] imaginary
		//               | decimal [+-] imaginary
		//
		//     imaginary ::= integer [ijJ]
		//                 | decimal [ijJ]
		//
		if (node._name === 'Complex') {
			return [node, unparsed];
		} else {
			return null;
		}
	},
};

module.exports = match;
