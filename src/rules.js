const { Map, List, Record } = require('immutable');
const AST = require('./ast');
const Skeleton = require('./skeleton'); // For nasty function defn hack


let currentSymbol = 0;

function gensym() {
	return 'S' + (++currentSymbol).toString(36).toUpperCase();
}


let match = {
	block: function(node, unparsed, scope) {
		// Match an expression list
		//
		//     block ::= expression*
		//
		if (node._name !== 'Block') { return null; }

		let innerScope = (node.getIn(['tags', 'module'])) ? scope.add(gensym()) : scope;

		return node.exprs.reduce((result, node) => {
			if (result === null) { return null; }

			let [block, unparsed, scope] = result;
			let expr, match = this.expression(node.terms.first(), node.terms.rest(), innerScope);
			if (!match) { return null; }

			[expr, trailing, inner] = match;
			if (trailing.count() !== 0) { return null; }

			return [
				block.update('exprs', (exprs) => { return exprs.push(expr) }),
				unparsed,
				scope
			];
		}, [new AST.Block({exprs: List([]), tags: node.tags, scope: innerScope}), unparsed, scope]);
	},

	expression: function(node, unparsed, scope) {
		// Match any expression
		// 
		//     expression ::= bindExpression
		//                  | typeDeclaration
		//                  | methodDeclaration
		//                  | expressionNoAssign
		//
		let exp = (
			this.bindExpression(node, unparsed, scope) ||
			this.typeDeclaration(node, unparsed, scope) ||
			this.methodDeclaration(node, unparsed, scope) ||
			this.expressionNoAssign(node, unparsed, scope)
		);

		if (exp && exp[1].count() > 0) {
			let ret = [new AST.Error({
				message: 'did not consume all tokens in expression',
				consumed: exp[0],
				encountered: exp[1]
			}), List([]), scope];
			return ret;
		} else {
			return exp;
		}
	},

	expressionNoAssign: function(node, unparsed, scope) {
		// Match any expression with the exception of assignment expressions
		//
		//     expressionNoAssign ::= infixExpression
		//                          | expressionNoInfix
		//
		let exp = (
			this.infixExpression(node, unparsed, scope) ||
			this.expressionNoInfix(node, unparsed, scope)
		);

		return exp;
	},

	infixExpression: function(node, unparsed, scope) {
		// Match an expression consisting of lefthand and righthand sub-
		// expressions joined by an infix operator
		//
		//     infixExpression ::= expressionNoInfix OPERATOR expressionNoAssign
		//
		let match = this.expressionNoInfix(node, unparsed, scope);
		let remaining, op, lvalue, rvalue;

		if (!match) { return null; }
		[lvalue, remaining, __] = match;
		if (remaining.count() === 0) { return null; }

		match = this.operator(remaining.first(), remaining.rest(), scope);
		if (!match) { return null; }

		[op, remaining, __] = match;

		// The double colon operator is only permitted in assignment
		// expressions; the single colon operator is only permitted in map
		// literals and messages with named parameters. The dot operator is
		// handled in the lookup rule of `expressionNoInfix`, and the
		// tilde operator is only permitted as a prefix.
		let disallowed = List(['::', ':', '~', '.', '?']);
		if (disallowed.contains(op.label) || remaining.count() === 0) { return null; }

		match = this.expressionNoAssign(remaining.first(), remaining.rest(), scope);
		if (!match) { return null; }

		[rvalue, remaining, __] = match;
		let infixExp;

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
		if (rvalue._name === 'InfixExpression' && !rvalue.getIn(['tags', 'parenthesized'], false)) {
			infixExp = rvalue.set('lhs', new AST.InfixExpression({
				lhs: lvalue, op: op, rhs: rvalue.lhs, scope: scope
			}));
		} else {
			infixExp = new AST.InfixExpression({lhs: lvalue, op: op, rhs: rvalue, scope: scope});
		}

		if (rvalue._name === 'Error') {
			// TODO: Why do we kill the unparsed list here?
			return [infixExp, List([]), scope];
		} else {
			return [infixExp, remaining, scope];
		}
	},

	expressionNoInfix: function(node, unparsed, scope) {
		// Match any expression that is not an `infixExpression`
		//
		//     expressionNoInfix ::= prefixExpression
		//                         | call (invocation)
		//                         | lookup
		//                         | accessor
		//                         | value
		//
		let selectorFromMessage = function(message) {
			return '(' + message.map(function(arg) {
				if (arg._name === 'KeyValuePair') {
					if (arg.key._name === 'Identifier') {
						return arg.key.label + ':';
					} else if (arg.key._name === 'Text') {
						return arg.key.value + ':';
					}
				} else if (arg._name === 'Symbol') {
					return arg.label + '.';
				} else if (arg._name === 'Text') {
					return arg.value;
				}
			}).join('') + ')';
		};

		let signatureFromMessage = function(message) {
			return '(' + message.map(function(arg) { return ':'; }).join('') + ')';
		};

		let argsFromMessage = function(message) {
			return message.map(function(arg) {
				return (arg._name === 'KeyValuePair') ? arg.val : arg;
			});
		};

		let pfxMatch = this.prefixExpression(node, unparsed, scope);
		if (pfxMatch) { return pfxMatch; }

		var expr = this.value(node, unparsed, scope);
		if (!expr) { return null; }

		var target;

		while (expr) {
			// We need to explicitly test for compound expressions. They are
			// property lookup (`struct.property`), function or method invocation
			// (`func(value)`), and collection interrogation (`list[index]`)
			// Chaining operations in any order (`func(value)[index].property`)
			// is permitted. Compound expressions are left associative
			let [next, rest] = [expr[1].first(), expr[1].rest()];
			target = expr;
			expr = null;

			if (next) {
				// If we find a clarification operation, we assign it to target.
				// If there was no match, target remains the previous value, and
				// we break out of the while loop and return the previous value.
				if (next._name === 'Symbol') {
					expr = [
						new AST.SymbolLookup({target: target[0], term: next, scope: scope}),
						rest,
						scope
					];
				} else if (next._name === 'Message') {
					let message = (
						this.symbolMessage(next, rest, scope) ||
						this.trailingFunc(next, rest, scope) ||
						this.namedParameterList(next, rest, scope) ||
						this.positionalParameterList(next, rest, scope)
					);

					if (message) {
						let invocation = new AST.Call({
							target: target[0],
							selector: selectorFromMessage(message[0]),
							args: message[0],
							scope: scope
						});

						expr = [invocation, message[1], scope];
					}
				} else if (next._name === 'List') {
					let lookup = this.list(next, rest, scope);

					expr = lookup && [
						new AST.SequenceAccess({
							target: target[0],
							terms: lookup[0].items,
							scope: scope
						}),
						lookup[1],
						scope
					];
				}
			}
		}

		return target;
	},

	symbolMessage: function(node, unparsed, scope) {
		// Matches a message containing a symbol which is a special form
		// to allow zero-argument method calls
		//
		//     symbolMessage ::= MESSAGE[ symbol ]
		//
		if (node._name === 'Message') {
			let [first, rest] = [node.exprs.first(), node.exprs.rest()];
			if (!first || rest.count() !== 0) { return null; }

			let match = this.symbol(first.terms.first(), first.terms.rest(), scope);
			if (!match) { return null; }

			let [symbol, remaining, __] = match;

			if (symbol.getIn(['tags', 'nullary'], false) && remaining.count() === 0) {
				return [List([symbol]), unparsed, scope];
			}
		}

		return null;
	},

	namedParameterList: function(node, unparsed, scope) {
		// Matches a list of named parameters for a method invocation
		// 
		//     namedParameterList ::= MESSAGE[ namedParameterPart+ ]
		//
		if (node._name === 'Message') {
			let exprs = node.exprs.reduce((result, expr) => {
				if (!result) { return null; }

				let [first, rest] = [expr.terms.first(), expr.terms.rest()];
				let match = this.namedParameterPart(expr.terms.first(), expr.terms.rest(), scope);
				if (!match) { return null; }

				let [exp, remaining, __] = match;
				if (remaining.count() !== 0) { return null; }

				return result.push(exp);
			}, List([]));

			if (exprs && exprs.count() > 0) {
				return [exprs, unparsed, scope];
			}
		}

		return null;
	},

	trailingFunc: function(node, unparsed, scope) {
		// Matches a list of named parameters plus a trailing callable literal
		//
		//     trailingFunc ::= MESSAGE[ namedParameterPart*, partialParameter ] scopedValue
		//
		if (node._name === 'Message') {
			let exprs = node.exprs.reduce((result, expr, key, iter) => {
				if (!result) { return null; }

				let [first, rest] = [expr.terms.first(), expr.terms.rest()];
				let match;

				if (key == iter.count() - 1) {
					match = this.partialParameter(expr.terms.first(), expr.terms.rest(), scope);
				} else {
					match = this.namedParameterPart(expr.terms.first(), expr.terms.rest(), scope);
				}
				if (!match) { return null; }

				let [exp, remaining, __] = match;
				if (remaining.count() !== 0) { return null; }

				return result.push(exp);
			}, List([]));

			if (exprs && exprs.count() > 0) {
				let match = this.scopedValue(unparsed.first(), unparsed.rest(), scope);
				if (!match) { return null; }

				let [val, remaining, __] = match;
				return [exprs.update(-1, (kvp) => kvp.set('val', val)), remaining, scope];
			}
		}

		return null;
	},

	positionalParameterList: function(node, unparsed, scope) {
		// Matches a list of expressions to be evaluated for a function call
		//
		//     positionalParameterList ::= MESSAGE[ expressionNoAssign* ]
		//
		if (node._name === 'Message') {
			let exprs = node.exprs.reduce((result, expr) => {
				if (!result) { return null; }

				let match = this.expressionNoAssign(expr.terms.first(), expr.terms.rest(), scope);
				if (!match) { return null; }

				let [exp, remaining, __] = match;
				if (remaining.count() !== 0) { return null; }

				return result.push(exp);
			}, List([]));

			return exprs && [exprs, unparsed, scope];
		}

		return null;
	},

	namedParameterPart: function(node, unparsed, scope) {
		// Matches a named parameter to a function
		//
		//     namedParameterPart ::= name OPERATOR[':'] expressionNoAssign
		//

		let match = this.identifier(node, unparsed, scope);
		if (!match) { return null; }
		
		let [ident, remaining, __] = match;
		let op, expr;

		if (ident.modifier !== null || remaining.count() === 0) { return null; }

		match = this.operator(remaining.first(), remaining.rest(), scope);
		if (!match) { return null; }

		[op, remaining, __] = match;
		if (op.label !== ':' || remaining.count() === 0) { return null; }

		match = this.expressionNoAssign(remaining.first(), remaining.rest(), scope);
		if (!match) { return null; }

		[expr, remaining, __] = match;
		if (remaining.count() !== 0) { return null; }

		return [new AST.KeyValuePair({key: ident, val: expr, scope: scope}), remaining, scope];
	},

	partialParameter: function(node, unparsed, scope) {
		// Matches a parameter name without its argument
		//
		//     partialParameter ::= name OPERATOR[':']
		//
		let match = this.identifier(node, unparsed, scope);
		if (!match) { return null; }

		let [ident, remaining, __] = match;
		let op;

		if (ident.modifier !== null || remaining.count() === 0) { return null; }

		match = this.operator(remaining.first(), remaining.rest(), scope);
		if (!match) { return null; }

		[op, remaining, __] = match;
		if (op.label !== ':' || remaining.count() !== 0) { return null; }

		return [new AST.KeyValuePair({key: ident, val: _, scope: scope}), remaining, scope];
	},

	bindExpression: function(node, unparsed, scope) {
		// Matches assignment expressions
		//
		//     bindExpression ::= template OPERATOR['::'] expressionNoAssign
		//
		let match = this.template(node, unparsed, scope);
		if (!match) { return null; }

		let [templ, remaining, matchScope] = match;
		let op, expr;
		if (remaining.count() === 0) { return null; }

		match = this.operator(remaining.first(), remaining.rest(), scope);
		if (!match) { return null; }

		[op, remaining, __] = match;
		if (op.label !== '::') { return null; }

		match = this.expressionNoAssign(remaining.first(), remaining.rest(), scope);
		if (!match) { return null; }

		[expr, remaining, __] = match;

		return [new AST.Bind({template: templ, value: expr, scope: scope}), remaining, scope];
	},

	typeDeclaration: function(node, unparsed, scope) {
		// Matches a type declaration
		//
		//     typeDeclaration ::= identifier interfaceList? recordType
		//                       | identifier interfaceList? unionType
		//                       | identifier interfaceList? machineType
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
		// - A record type is an ordered collection of named fields
		//     `Point << Integer x, Integer y >>
		//
		// - An instance of a record type may be instantiated by providing
		//   positional arguments to the type identifier
		//     ```
		//     p1 :: Point(x: 3, y: 5)
		//     p2 :: Point(7, 4)
		//
		// - A union type consists of two or more variants, separated by `|`
		//     `Boolean << .True | .False >>`
		//
		// - A union's variants may be accessed with the dot operator
		//     ```
		//     Boolean p :: .True
		//     q :: Boolean.False
		//     ```
		//
		// - A union variant may have a list of associated values
		//     ```
		//     Color << .RGB(Integer, Integer, Integer)
		//            | .CMYK(Decimal, Decimal, Decimal, Decimal) >>
		//     ```
		//
		// - A variant with associated values may be instantiated by providing
		//   positional arguments to the variant
		//     ```
		//     redColor :: Color.RGB(255, 0, 0)
		//     cyanColor :: Color.CMYK(1.0, 0.0, 0.0, 0.0)
		//     ```
		// - A machine type specifies only its storage size as a number of bits
		//     ```
		//     UInt32 (Unsigned) << 32 >>
		//     Int32 (Signed) << 32 >>
		//     UInt64 (Unsigned) << 64 >>
		//     Int64 (Signed) << 64 >>
		//     ```
		//
		// - Machine types may also indicate bit layouts. The layouts are bit
		//   aligned and the total size of a value with a particular machine
		//   type is the sum of the individual segments
		//     ```
		//     Float32 (Float) << 1, 8, 23 >>
		//     Float64 (Float) << 1, 11, 52 >>
		//     ```
		//
		// - Machine types may be matched against in a pattern match template
		//     ```
		//     Float32(sign, exponent, fraction) :: -12345.6789
		//     sign == 0x1
		//     exponent == 0x8C
		//     fraction == 0x40E6B7
		//     ```
		let match = this.identifier(node, unparsed, scope);
		if (!match) { return null; }

		let [ident, remaining, newScope] = match;
		if (!(remaining.count() > 0)) { return null; }

		// Match an interface list if there is one
		let interfaces;

		match = this.interfaceList(remaining.first(), remaining.rest(), scope);

		if (match && match[1].count() > 1) {
			[interfaces, remaining, __] = match;
		} else {
			interfaces = List([]);
		}

		let [first, rest] = [remaining.first(), remaining.rest()];

		match = (
			this.recordType(first, rest, newScope) ||
			this.unionType(first, rest, newScope) ||
			this.machineType(first, rest, newScope)
		);
		if (!match) { return null; }

		let [type, returnTokens, returnScope] = match;
		type = type.set('label', ident.label).set('interfaces', interfaces);

		return [type, returnTokens, returnScope];
	},

	recordType: function(node, unparsed, scope) {
		// Match a record type declaration
		//
		//     recordType ::= TYPE[ (identifier identifier?)* ]
		//
		if (node._name === 'Type') {
			let members = [];

			for (let expr of node.exprs) {
				let first = this.identifier(expr.terms.first(), expr.terms.rest(), scope);
				let second;

				if (!first) {
					return null;
				}

				if (first[1].count() > 0) {
					second = this.identifier(first[1].first(), first[1].rest(), scope);

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

			let type = new AST.RecordType({members: List(members), scope: scope});
			return [type, unparsed, scope];
		}
		return null;
	},

	unionType: function(node, unparsed, scope) {
		// Matches a union type literal
		//
		//     unionType ::= TYPE[ variant ( OPERATOR['|'] variant )* ]
		//
		//     variant ::= symbol | symbol LIST[ Identifier + ]
		//
		if (node._name === 'Type') {
			if (node.exprs.count() !== 1) {
				return null;
			}

			// Split the variants on the '|' operator, then reduce each sublist
			// into either a symbol or a tuple.
			let variants = node.exprs.first().terms.reduce((result, term) => {
				if (result === null) { return null; }

				if (term._name === 'Message') {
					//Parse the identifiers in the message
					let values = term.exprs.reduce((vs, v) => {
						if (vs._name === 'Error') {
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

					if (!(values._name === 'Error')) {
						// We successfully parsed a tuple
						return result.update(-1, (symbol) => {
							return new AST.Tuple({
								label: symbol.label,
								values: values,
								scope: scope
							});
						});
					} else {
					// TODO: Better error handling here
						return null; //result.push(values);
					}
				} else if (term._name === 'Operator' && term.label === '|') {
					return result;
				} else if (term._name === 'Symbol') {
					return result.push(term);
				} else {
					return null;
				}
			}, List([]));

			if (variants && variants.count() >= 2) {
				let type = new AST.UnionType({
					variants: Map(variants.map((v) => { return [v.label, v]; })),
					scope: scope
				});

				return [type, unparsed, scope];
			} else {
				return null;
			}
		}
		return null;
	},

	machineType: function(node, unparsed, scope) {
		//
		//    machineType ::= TYPE[ bitSize+ ]
		//
		if (node._name !== 'Type') { return null; }

		let bitlayout = node.exprs.reduce((list, expr) => {
			if (list === null) { return null; }

			let size, terms, match = this.integer(expr.terms.first(), expr.terms.rest(), scope);
			if (!match) { return null; }

			[size, terms, __] = match;
			if (terms.count() !== 0) { return null; }

			return list.push(size.value);
		}, List([]));

		if (!bitlayout) { return null; }

		return [new AST.MachineType({
			bitlayout: bitlayout, scope: scope
		}), unparsed, scope];
	},

	interfaceList: function(node, unparsed, scope) {
		//
		//    interfaceList ::= MESSAGE[ Identifier* ]
		//
		if (node._name !== 'Message') { return null; }

		let op, match, tokens, ifaces = List([]);

		let interfaces = node.exprs.reduce((list, expr) => {
			if (list === null) { return null; }

			let name, terms, match = this.identifier(expr.terms.first(), expr.terms.rest(), scope);
			if (!match) { return null; }

			[name, terms, __] = match;
			if (terms.count() !== 0) { return null; }

			return list.push(name.label);
		}, List([]));

		if (!interfaces) { return null; }

		return [interfaces, unparsed, scope];
	},

	methodDeclaration: function(node, unparsed, scope) {
		//
		//     methodDeclaration ::=
		//             identifier identifier selector OPERATOR['->'] functionBody
		//
		if (node._name !== 'Identifier' || unparsed.count() < 3) { return null; }
		let innerScope = scope.add(gensym());

		let name, selector, op, body;
		let match = this.identifier(unparsed.first(), unparsed.rest(), innerScope);
		if (!match) { return null; }

		[name, unparsed, innerScope] = match;
		if (unparsed.count === 0) { return null; }

		match = (this.selector(unparsed.first(), unparsed.rest(), innerScope)
			|| this.unarySelector(unparsed.first(), unparsed.rest(), innerScope)
		);
		if (!match) { return null; }

		[selector, unparsed, innerScope] = match;
		if (unparsed.count() === 0) { return null; }

		match = this.operator(unparsed.first(), unparsed.rest(), scope);
		if (!match) { return null; }

		[op, unparsed, __] = match;
		if (op.label !== '->') { return null; }

		match = this.functionBody(unparsed.first(), unparsed.rest(), innerScope);
		if (!match) { return null; }

		[body, unparsed, __] = match;

		name = name.setIn(['tags', 'type'], node.label)
			.set('scope', innerScope);

		let method = new AST.Method({
			target: name, selector: selector, block: body, scope: scope
		});
		return [method, unparsed, scope];
	},

	selector: function(node, unparsed, scope) {
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
				self.identifier(expr.terms.first(), expr.terms.rest(), scope) ||
				self.text(expr.terms.first(), expr.terms.rest(), scope)
			);

			if (!(id && id[1].count() > 1)) { return null; }

			let op = self.operator(id[1].first(), id[1].rest(), scope);
			if (!(op && op[0].label === ':')) { return null; }

			let first = self.identifier(op[1].first(), op[1].rest(), scope);
			let name;

			if (!(first && first[1].count() < 2)) {
				return null;
			} else if (first[1].count() === 1) {
				let second = self.identifier(first[1].first(), first[1].rest(), scope);
				if (!second) {
					return null;
				} else {
					name = second[0].setIn(['tags', 'type'], first[0].label)
						.setIn(['tags', 'mode'], 'arg'); // TODO: remove intro tag
				}
			} else {
				name = first[0].setIn(['tags', 'mode'], 'arg');
			}

			return result.push(new AST.KeyValuePair({key: id[0], val: name, scope: scope}));
		}, List([]));

		return parts && [parts, unparsed, scope];
	},

	unarySelector: function(node, unparsed, scope) {
		if (node._name !== 'Message') { return null; }

		let self = this;
		let parts = node.exprs.reduce(function(result, expr) {
			if (result === null) { return null; }

			let qual = (
				self.text(expr.terms.first(), expr.terms.rest(), scope) ||
				self.symbol(expr.terms.first(), expr.terms.rest(), scope)
			);

			if (!(qual && qual[1].count() === 0)) { return null; }
			if (qual._name == 'Symbol' && !qual.getIn(['tags', 'nullary'], false)) {
				return null;
			}

			return result.push(qual[0]);
		}, List([]));

		return parts && [parts, unparsed, scope];
	},

	template: function(node, unparsed, scope) {
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
		// Scalar literals   `'text'`, `123.45`, `.symbol`
		//
		// What about nesting? Are any of the following allowed?
		// `[a, [b, c], d...]`
		// `[(a...) -> b, (Integer c) -> { ..., Integer d }]`
		//
		// What about infix expressions? This gets super tricky.
		// `a + b :: 1 + 2` => `[$a: 1, $b: 2]`
		// `a :: { 1 + 2 }` => `[$a: { 1 + 2 }]`
		// `a.exprs(last)`  => `MessageSend(target: 1, message:('+': 2))`

		let innerScopes = scope//.add(gensym());
		// [BB 2017-08-12]: Currently templates support lists, maps, and blocks
		if (node._name === 'List' || node._name === 'Block') {
			// If the template is a List or Block, treat each expr as a template.
			let parts = node.exprs.reduce((result, exp) => {
				if (result === null) { return null; }

				let part = this.template(exp.terms.first(), exp.terms.rest(), innerScopes);
				// N.B.: If we don't want to allow nesting, just change
				// `this.template` to `this.templatePart`.

				if (part && part[1].count() > 0) {
					return result.push(new AST.Error({
						message: 'Match error.',
						consumed: part[0],
						encountered: part[1]
					}));
				} else if (part) {
					// TODO: This could be made cleaner by just accepting a
					// message skeleton node and always setting 'local' on
					// its arguments 
					if (node.getIn(['tags', 'as']) === 'arguments'
							&& part[0]._name === 'Identifier') {
						part[0] = part[0].setIn(['tags', 'local'], true);
					}

					return result.push(part[0]);
				} else {
					return null;
				}
			}, List([]));

			let constructor = {
				'List': (parts) => { return new AST.List({items: parts, scope: scope}); },
				'Block': (parts) => { return new AST.Block({exprs: parts, scope: scope}); }
			};
			return parts && [constructor[node._name](parts), unparsed, innerScopes];
		} else {
			// Otherwise, we look for a template part.
			let template = this.templatePart(node, unparsed, innerScopes);
			return template;
		}

		return null;
	},

	templatePart: function (node, unparsed, scope) {
		// Matches an identifier or scalar literal in a template
		//
		//     templatePart ::= [identifier] identifier
		//                    | symbol MESSAGE[ templatePart+ ]
		//                    | text
		//                    | integer
		//                    | decimal
		//                    | scientific
		//                    | complex
		//
		let first, match = (
			this.keyValuePart(node, unparsed, scope) ||
			this.identifier(node, unparsed, scope) ||
			this.tuplePart(node, unparsed, scope) ||
			/*this.recordTemplate(node, unparsed, scope) ||*/
			this.text(node, unparsed, scope) ||
			this.integer(node, unparsed, scope) ||
			this.decimal(node, unparsed, scope) ||
			this.scientific(node, unparsed, scope) ||
			this.complex(node, unparsed, scope)
		);

		if (!match) { return null; }

		[first, unparsed, scope] = match;
		
		if (first._name === 'Identifier') {
			let ident = first;

			if (unparsed.count() > 0) {
				let second, oper;
				match = this.identifier(unparsed.first(), unparsed.rest(), scope);
				
				if (match) {
					[second, unparsed, scope] = match;
				} else {
					second = null;
				}

				match = this.operator(unparsed.first(), unparsed.rest(), scope);

				if (match && match[0].label === '...') {
					[oper, unparsed, scope] = match;
				} else {
					oper = null;
				}

				if (second) {
					ident = second.setIn(['tags', 'type'], first.label);
				}

				if (oper) {
					ident = ident.setIn(['tags', 'collect'], true);
				}
			}

			ident = ident.setIn(['tags', 'mode'], 'lvalue');
			return [ident, unparsed, scope];
		} else {
			return [first, unparsed, scope];
		}
	},

	tuplePart: function(node, unparsed, scope) {
		// Match an unqualified variant fragment
		//
		//     tupleTemplate ::= symbol MESSAGE[ Identifier + ]
		//
		let symbol, match = this.symbol(node, unparsed, scope);
		if (!match) { return null; }

		[symbol, unparsed, scope] = match;

		if (unparsed.count() > 0) {
			let message = unparsed.first();

			if (message._name === 'Message') {
				let values = message.exprs.reduce((result, expr) => {
					if (result === null) { return null; }

					let part = this.templatePart(expr.terms.first(), expr.terms.rest(), scope);

					if (part && part[1].count() === 0) {
						return result.push(part[0]);
					} else {
						return null;
					}
				}, List([]));

				return (values.count() >= 1) ? [
					new AST.Tuple({label: node.label, values: List(values), scope: scope}),
					unparsed.rest(),
					scope
				] : null; // TODO: This should be an error.
			}
		}

		return [symbol, unparsed, scope];
	},

	keyValuePart: function(node, unparsed, scope) {
		let key = this.expressionNoInfix(node, unparsed, scope);

		if (key) {
			let [first, rest] = [key[1].first(), key[1].rest()];

			if (first && first._name === 'Operator' && first.label === ':') {
				let val = this.templatePart(rest.first(), rest.rest(), scope);
				return [new AST.KeyValuePair({key: key[0], val: val[0], scope: scope}), val[1], scope];
			}
		}
		
		return null;
	},

	recordTemplate: function(node, unparsed, scope) {
		// Match a record value
		//
		//     recordTemplate ::= label MESSAGE[ (label OPERATOR[':'] templatePart)+ ]
		//                      | label MESSAGE[ IDENTIFIER['_'] ]
		//
		if (node._name !== 'Identifier') { return null; }

		if (unparsed.count() > 0 && unparsed.first()._name === 'Message') {
			/// TODO TODO TODO
			let record = new AST.Record();

			return [record.set('scope', scope), unparsed.rest(), scope];
		} else {
			return null;
		}
	},

	prefixExpression: function(node, unparsed, scope) {
		// Match a prefix expression
		//
		//     prefixExpression ::= operator expressionNoInfix
		//
		const prefixOperators = List(['+', '-', '!', '~', '^', '\\']);
		if (node._name !== 'Operator' || !prefixOperators.contains(node.label)) { return null; }

		let exp = this.expressionNoInfix(unparsed.first(), unparsed.rest(), scope);

		if (exp && node.label === '\\') {
			// I'll admit it's a little weird to have this transform here since
			// we don't typically transform in the parse phase, but we need to
			// mark immediate evaluation nodes as such.
			let target = exp[0].transform((elt) => {
				return elt._name === 'Identifier' ? elt.setIn(['tags', 'mode'], 'immediate') : elt;
			});
			return [new AST.Immediate({target: target, scope: scope}), exp[1], scope];
		} else if (exp) {
			return [new AST.PrefixExpression({op: node, expr: exp[0], scope: scope}), exp[1], scope];
		} else {
			return null;
		}
	},

	value: function(node, unparsed, scope) {
		// Match a value
		//
		//     value ::= block | hybridDefn | functionDefn | identifier | symbol
		//             | parenthesized | map | list | text | integer | decimal
		//             | scientific | complex
		//
		let symbol = gensym();

		if (node._name === 'Block') {
			if (node.getIn(['tags', 'envelopeShape']) === '{}') {
				// Regular ol' block. Recursively descend and build the scope.
				let block = this.block(node, [], scope.add(symbol));
				return block && [block[0], unparsed, scope];
			} else if (node.getIn(['tags', 'envelopeShape']) === '{{}}') {
				// Pattern matching function. Parse each individual function. 
				return this.hybridDefn(node, unparsed, scope);
			}
		}

		let match = (
			this.functionDefn(node, unparsed, scope.add(symbol)) ||
			this.identifier(node, unparsed, scope) ||
			this.symbol(node, unparsed, scope) ||
			this.parenthesized(node, unparsed, scope) ||
			this.map(node, unparsed, scope) ||
			this.list(node, unparsed, scope) ||
			this.text(node, unparsed, scope) ||
			this.integer(node, unparsed, scope) ||
			this.decimal(node, unparsed, scope) ||
			this.scientific(node, unparsed, scope) ||
			this.complex(node, unparsed, scope)
		);

		return match && [match[0], match[1], scope];
	},

	scopedValue: function(node, unparsed, scope) {
		// Match a block, function, or hybrid function
		//
		//     scopedValue ::= block | hybridDefn | functionDefn
		//
		let symbol = gensym();

		if (node._name === 'Block') {
			if (node.getIn(['tags', 'envelopeShape']) === '{}') {
				// Regular ol' block. Recursively descend and build the scope.
				let block = this.block(node, [], scope.add(symbol));
				return block && [block[0], unparsed, scope];
			} else if (node.getIn(['tags', 'envelopeShape']) === '{{}}') {
				// Pattern matching function. Parse each individual function. 
				return this.hybridDefn(node, unparsed, scope);
			}
		}

		let match = this.functionDefn(node, unparsed, scope.add(symbol));

		return match && [match[0], match[1], scope];
	},

	parenthesized: function(node, unparsed, scope) {
		// Match a parenthesized expression
		//
		//     parenthesized ::= MESSAGE[ expressionNoAssign ]
		//
		if (node._name === 'Message' && node.getIn(['tags', 'specialForm']) == true) {
			let skelExpr = node.exprs.first();
			let [first, rest] = [skelExpr.terms.first(), skelExpr.terms.rest()];
			let expr = this.expressionNoAssign(first, rest, scope);
			//TODO: add error if there's unparsed?

			if (!expr) { return null; }
			if (expr[1].count() > 0) {
				return [new AST.Error({
					message: 'did not consume all tokens in parenthesized expression',
					consumed: expr[0],
					encountered: expr[1]
				}), unparsed, scope];
			}

			return [expr[0].setIn(['tags', 'parenthesized'], true), unparsed, scope];
		}

		return null;
	},

	hybridDefn: function(node, unparsed, scope) { // TODO: this doesn't compose with fns
		// Matches a pattern match definition
		//
		//     hybridDefn ::= MATCHLIST[ functionDefn + ]
		//
		if (node._name === 'Block' &&
				node.getIn(['tags', 'envelopeShape']) === '{{}}') {
			let funcs = [];

			for (let expr of node.exprs) {
				let symbol = gensym();
				let fn = this.functionDefn(expr.terms.first(), expr.terms.rest(), scope.add(symbol));
				if (fn && fn[1].count() === 0) {
					funcs.push(fn[0]);
				} else if (fn) {
					funcs.push(new AST.Error({
						message: 'did not consume all tokens in function definition',
						consumed: fn[0],
						encountered: fn[0]
					}));
				} else {
					return null;
				}
			}

			return [new AST.HybridFunction({predicates: funcs, scope: scope}), unparsed, scope];
		} else {
			return null;
		}
	},

	functionDefn: function(node, unparsed, scope) {
		// Matches a function definition
		//
		//     functionDefn ::= idList guard? OPERATOR['->'] functionBody
		//
		if (node._name !== 'Message') { return null; }

		// Parsing a template requires a `List` rather than a `Message`
		// skeleton node, so we create the List node here.
		// TODO: Update the `template` match function to also take `Message` nodes
		let listNode = new Skeleton.List({
			exprs: node.exprs,
			tags: node.tags.set('as', 'arguments')
		});

		let innerScope = scope;//.add(gensym());
		let templ, guard, op, body;

		let match = this.template(listNode, unparsed, innerScope);
		if (!match) { return null; }

		[templ, unparsed, innerScope] = match;
		if (unparsed.count() === 0) { return null; }

		match = this.guard(unparsed.first(), unparsed.rest(), innerScope);

		if (match) {
			[guard, unparsed, innerScope] = match;
		} else {
			guard = null;
		}

		match = this.operator(unparsed.first(), unparsed.rest(), innerScope);
		if (!match) { return null; }

		[op, unparsed, __] = match;
		if (op.label !== '->') { return null; }

		match = this.functionBody(unparsed.first(), unparsed.rest(), innerScope);
		if (!match) { return null; }

		[body, unparsed, innerScope] = match;
		let func = new AST.Function({template: templ, guard: guard, block: body, scope: scope}); 
		return [func, unparsed, scope];
	},

	functionBody: function(node, unparsed, scope) {
		// Match a function body
		//
		//     functionBody ::= block
		//                    | functionDefn
		//                    | hybridDefn
		//                    | matchRemap (TODO) 
		//
		let block;

		if (node._name === 'Block' && node.getIn(['tags', 'envelopeShape']) === '{}') {
			block = this.block(node, unparsed, scope);
		} else {
			block = (this.functionDefn(node, unparsed, scope)
				|| this.hybridDefn(node, unparsed, scope));
		}

		return block;
	},

	guard: function(node, unparsed, scope) {
		// Match a guard clause
		//
		//     guard ::= OPERATOR['?'] parenthesized
		//
		let op, expr, match = this.operator(node, unparsed, scope);
		if (!match) { return null; }

		[op, unparsed, __] = match;
		if (op.label !== '?' || unparsed.count() === 0) { return null; }

		expr = this.parenthesized(unparsed.first(), unparsed.rest(), scope);
		return expr;
	},

	list: function(node, unparsed, scope) {
		// Match a list literal
		//
		//     list ::= LIST[ expressionNoAssign * ]
		//
		if (node._name === 'List'/* && node.getIn(['tags', 'envelopeShape']) === '[]'*/) {
			if (node.exprs.count() === 0) {
				return [new AST.List({items: List([]), scope: scope}), unparsed, scope];
			}

			let exprs = node.exprs.reduce((result, expr) => {
				if (result === null) { return null; }

				let exp = this.expressionNoAssign(expr.terms.first(), expr.terms.rest(), scope);

				if (exp && exp[1].count() === 0) {
					return result.push(exp[0]);
				} else {
					return null;
				}
			}, List([]));

			return exprs && [new AST.List({items: exprs, scope: scope}), unparsed, scope];
		}

		return null;
	},

	map: function(node, unparsed, scope) {
		// Matches a map literal
		//
		//     map ::= LIST[ (expressionNoInfix OPERATOR[':'] expressionNoAssign) * ]
		//           | LIST[ OPERATOR[':'] ]
		//
		//
		// Note that the reason we disallow the ':' operator in infix expressions
		// is to distinguish between a key-value pair in a map and an infix
		// expression in a list.
		//
		// I'm not sure if infix expressions will actually cause trouble as
		// dictionary keys (they get evaluated before the dictionary is built)
		// but it's always easier to add the feature later when people request
		// it than remove it because it causes trouble down the road.
		//
		//  [ a : 1 ]
		//    ^ ^ ^
		//    | | +---- Expression			   1
		//    | +------ Operator			   :
		//    +-------- Non-Infix Expression   a
		//  [ a + 1 ]
		//    ^ ^ ^
		//    | | +---- Expression			   1
		//    | +------ Operator			   +
		//    +-------- Non-Infix Expression   a
		//
		if (node._name === 'List') {
			if (node.exprs.count() === 1
					&& node.exprs.first().terms.count() === 1) {
				let op = node.exprs.first().terms.first();
				if (op._name === 'Operator' && op.label === ':') {
					return [new AST.Map({items: List([]), scope: scope}), unparsed, scope];
				} else {
					return null;
				}
			} else if (node.exprs.count() === 0) {
				return null;
			}

			let items = node.exprs.reduce((result, expr) => {
				if (result === null) { return null; }

				let key = this.expressionNoInfix(expr.terms.first(), expr.terms.rest(), scope);

				if (key) {
					let [first, rest] = [key[1].first(), key[1].rest()];
					
					if (first && first._name === 'Operator' && first.label === ':') {
						let val = this.expressionNoAssign(rest.first(), rest.rest(), scope);
						return result.push(new AST.KeyValuePair({
							key: key[0],
							val: val[0],
							scope: scope
						}));
					} else {
						// We started parsing *something* but it's not what the map rule
						// was expecting. Backtrack.
						return null;
					}
				} else {
					// If we didn't find an expressionNoInfix, it may be because
					// we're actually in a list and have to backtrack.
					return null;
				}
			}, List([]));

			return items && [new AST.Map({items: items, scope: scope}), unparsed, scope];
		}

		return null;
	},

	operator: function(node, unparsed, scope) {
		// Matches an operator
		//
		//     operator ::= '+' | '-' | '*' | '/' | ...
		//
		if (node._name === 'Operator') {
			return [node.set('scope', scope), unparsed, scope];
		} else {
			return null;
		}
	},

	identifier: function(node, unparsed, scope) {
		// Matches an identifier
		//
		//     identifier ::= [a-zA-Z_] [a-zA-Z0-9_-]* postfixModifier?
		//
		//     postfixModifier ::= [?!]
		//     TODO: should '...' also be a postfix mod instead of an op?
		//
		if (node._name === 'Identifier') {
			return [node.set('scope', scope), unparsed, scope];
		} else {
			return null;
		}
	},

	symbol: function(node, unparsed, scope) {
		// Matches a symbol
		//
		//     symbol ::= '.' [a-zA-Z0-9_-]+
		//
		if (node._name === 'Symbol') {
			if (scope === null) { console.log('!!!!!!') }
			return [node.set('scope', scope), unparsed, scope];
		} else {
			return null;
		}
	},

	typeVar: function(node, unparsed, scope) {
		// Matches a type variable
		//
		//     typevar ::= '$' [a-zA-Z_] [a-zA-Z0-9_-]*
		//
		if (node._name === 'TypeVar') {
			return [node.set('scope', scope), unparsed, scope];
		} else {
			return null;
		}
	},

	text: function(node, unparsed, scope) {
		// Matches a text value
		//
		//     text ::= TEXT
		//
		if (node._name === 'Text') {
			return [node.set('scope', scope), unparsed, scope];
		} else {
			return null;
		}
	},

	integer: function(node, unparsed, scope) {
		// Matches an integer value
		//
		//     integer ::= DIGIT+
		//
		if (node._name === 'Integer') {
			return [node.set('scope', scope), unparsed, scope];
		} else {
			return null;
		}
	},

	decimal: function(node, unparsed, scope) {
		// Matches a decimal value
		//
		//     decimal ::= DIGIT+ '.' DIGIT*
		//
		if (node._name === 'Decimal') {
			return [node.set('scope', scope), unparsed, scope];
		} else {
			return null;
		}
	},

	scientific: function(node, unparsed, scope) {
		// Matches a numeric value in scientific notation
		//
		//     scientific ::= integer [eE] [+-]? integer
		//                  | decimal [eE] [+-]? integer
		//
		if (node._name === 'Scientific') {
			return [node.set('scope', scope), unparsed, scope];
		} else {
			return null;
		}
	},

	complex: function(node, unparsed, scope) {
		// Matches a complex value
		//
		//     complex ::= integer [+-] imaginary
		//               | decimal [+-] imaginary
		//
		//     imaginary ::= integer [ijJ]
		//                 | decimal [ijJ]
		//
		if (node._name === 'Complex') {
			return [node.set('scope', scope), unparsed, scope];
		} else {
			return null;
		}
	},
};

module.exports = match;
