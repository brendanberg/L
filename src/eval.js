var AST = require('./ast');
var Context = require('./context');
var error = require('./error');

(function(AST) {
	function clone(obj) {
		if (obj == null || typeof obj !== 'object') { return obj; }
		var copy = obj.constructor();
		for (var attr in obj) {
			if (obj.hasOwnProperty(attr)) { copy[attr] = obj[attr]; }
		}
		return copy;
	};

	function gcd(a, b) {
		// Yikes, JS maths o_O
		if (b == 0) { return a; }
		return gcd(b, a % b);
	}
	
	AST.ExpressionList.prototype.eval = function(ctx) {
		var val;
		for (var i = 0, len = this.list.length; i < len; i++) {
			if ('eval' in this.list[i]) {
				val = this.list[i].eval(ctx);
			}
		}
		return val;
	};

	AST.PrefixExpression.prototype.eval = function (ctx) {
		var exp = this.exp.eval(ctx);
		var ident = new AST.Identifier("'" + this.op + "'");
		var params = new AST.List([ident], {source: 'parameterList'});
		var invocation = new AST.Invocation(exp, params);
		return invocation.eval(ctx);
	};

	AST.InfixExpression.prototype.eval = function (ctx) {
		var msg, expr, name;
		if (this.op === ':') {
			// Special case for assignment. Probably make this a macro at
			// some point, but not now bc I need assignment and I haven't
			// built macros yet.
			expr = new AST.Assignment(this.lhs, this.rhs.eval(ctx));
		} else {
			var exp = this.lhs.eval(ctx);
			var p0 = new AST.KeyValuePair(
				new AST.Identifier("'" + this.op + "'"),
				this.rhs.eval(ctx)
			);
			var params = new AST.List([p0], {source: 'parameterList'});
			expr = new AST.Invocation(exp, params);
		}

		return expr.eval(ctx);
	};

	AST.Assignment.prototype.eval = function(ctx) {
		ctx[':'].call(ctx, this.identifier, this.value);
	};

	AST.Invocation.prototype.eval = function(ctx) {
		var target = this.target.eval(ctx); // Should verify we got a function
		var func, locals, params;

		function clone(obj) {
			if (obj === null || typeof obj !== 'object') { return obj; }
			var copy = obj.constructor() || {};
			for (var attr in obj) {
				if (obj.hasOwnProperty(attr)) { copy[attr] = obj[attr]; }
			}
			return copy;
		}

		if (target.type === 'Function') {
			func = new AST.Function(target.plist, target.block);
			func.ctx = clone(target.ctx);
			locals = new Context();
			params = func.plist.list;

			for (var i = 0, len = params.length; i < len; i++) {
				locals[params[i].name] = this.params.list[i].eval(ctx);
			}

			locals.__proto__ = func.block.ctx;
			if (func.block.type === 'Function') {
				return func.block.eval(locals);
			} else if (func.block.type === 'Match') {
				return func.block.eval(locals);
			} else if (func.block.type === 'Block') {
				return func.block.expressionList.eval(locals);
			}
		} else if (target.type === 'Match') {
			func = new AST.Match(target.kvl);
			func.predicates = target.predicates;
			//TODO: copy predicates instead of pointing?
			func.ctx = clone(target.ctx);

			var predicates = func.predicates;
			var result = null;
			params = this.params.list.map(function(x) { return x.eval(ctx) });
			for(var i in predicates) {
				var pair = predicates[i];
				var context = null;
				try {
					context = pair[0].apply(null, params);
				} catch (e) {
					if (!(e instanceof error.MatchError)) {
						throw e;
					}
				}
				if (context) {
					if ('ctx' in pair[1]) { context.__proto__ = pair[1].ctx }
					if (pair[1].type === 'Block') {
						result = pair[1].expressionList.eval(context);
					} else {
						result = pair[1];
					}
					break;
				} 
			}
			return result || new AST.Bottom();
		} else if (target.type === 'Block') {
			return new AST.Block(target.expressionList.eval(ctx));
		} else {
			// This is a method invocation LOL
			// Take the selector keys and string em together.
			// Dispatch will select on the type signature so get that right
			// when you define the ctx
			// > Thing: <s: String>
			// > Thing(reverse) -> { this.s(reverse) }
			// > t = Thing(s: "stressed")
			// > t(reverse)
			// 'desserts'
			var context = clone(ctx);
			var selector = '(' + this.params.list.map(function(x) {
				if (x.type === 'KeyValuePair') {
					return x.key.name + ':';
				} else {
					return x.name;
				}
			}).join('') + ')';
			var method;

			if (target.type === 'Struct') {
				target.name = target.tags['name'];
			}

			var method = target.ctx[selector];
			
			//console.log(JSON.stringify(target));
			//console.log(JSON.stringify(target.ctx));

			if (method === undefined) {
				method = target.ctx.__proto__[selector];
			}

			if (method && typeof method === 'function') {
				params = this.params.list.filter(function (x) {
					return x.type === 'KeyValuePair';
				}).map(function(x) {
					return x.val.eval(ctx);
				});

				target.ctx.__proto__ = ctx;
				return method.apply(target, params) || new AST.Bottom();
			} else if (method && method.type === 'Function') {
				//target.ctx[selector].type === 'Function') {
				return new AST.String('Whoa! Not implemented!');
			} else if (method && method.type === 'Method') {
				// (target.ctx[selector].type === 'Method') {
				if (target.type === 'Struct' || target.type === 'Option') {
					throw new error.NotImplemented(
						"method invocations on types are not implemented"
					);
				}
				//var meth = target.ctx[selector];
				func = new AST.Method(method.typeId, method.plist, method.block);
				func.ctx = clone(target.ctx);
				locals = new Context();
				params = func.plist.list;

				for (var i = 0, len = params.length; i < len; i++) {
					if (params[i][1]) {
						locals[params[i][1].name] = this.params.list[i].val.eval(ctx);
					}
				}

				locals.__proto__ = func.block.ctx;
				locals['this'] = target;
				return func.block.expressionList.eval(locals);
			} else {
				var msg = (
					"'" + target.name + "' does not have a method " +
					"matching the selector '" + selector + "'"
				);
				throw new error.NameError(msg);
			}
		}
	};

	AST.MessageSend.prototype.eval = function(ctx) {
		var lookup;
		var selector;

		console.log('MESSAGE SEND');
		if (this.receiver) {
			var recv = this.receiver;
			lookup = function(name) {
				var selector = recv.ctx[name];

				if (selector === undefined) {
					selector = recv.__proto__.ctx[name];
				}

				return selector;
			};
		} else {
			lookup = function(name) { return ctx[name]; };
		}

		selector = lookup(this.message.identifier.name);

		if (selector && typeof selector === 'function') {
			var evaluate = function (x) { return x.eval(ctx) };
			return selector.apply(this.receiver, this.message.params.list.map(evaluate));
		} else if (selector && selector.type === 'Function') {
			// Eval the function ugh
			var scope;

			if (selector.plist.length !== this.message.params.length) {
				throw 'function signatures do not match';
			}

			scope = clone(selector.ctx);

			for (var i = 0, len = selector.plist.list.length; i < len; i++) {
				scope[selector.plist.list[i].name] = this.message.params.list[i].eval(ctx);
			}

			return selector.block.expressionList.eval(scope);
		} else if (selector && selector.type === 'Method') {
			throw new error.NotImplemented(
				"THIS ISN'T HOW WE DO METHOD INVOCATION ANYMORE");
			// Method evaluation is slightly different.
		} else {
			return selector;
		}
	};

	AST.Function.prototype.eval = function(ctx) {
		var func = new AST.Function(this.plist, this.block.eval(ctx));
		//func.ctx = ctx;
		return func;
	};

	AST.Match.prototype.eval = function(ctx) {
		var match = new AST.Match();
		match.ctx = ctx;
		var ps = [];
		var kvl = [];
		for (var i = 0, len = this.kvl.length; i < len; i++) {
			var kvp = new AST.KeyValuePair(this.kvl[i].key, this.kvl[i].val.eval(ctx));
			ps.push([ctx.match.curry(kvp.key), kvp.val]);
			kvl.push(kvp);
		}
		match.predicates = ps;
		match.kvl = kvl;
		return match;
	};

	AST.Block.prototype.eval = function(ctx) {
		var block = new AST.Block();
		block.ctx = ctx;
		// Recursively search for prefix expressions with a '\' operator
		// and replace them with their evaluated value
		block.expressionList = this.expressionList.transform(function(node) {
			if (node.type === 'PrefixExpression' && node.op === "'\\'") {
				return node.exp.eval(ctx);
			} else {
				return node;
			}
		});
		return block;
	};

	AST.Method.prototype.eval = function(ctx) {
		// This is kind of a weird one because methods are declarative and
		// operate on a type defined in the package context. Importing the
		// type will also import its context I guess

		var type = this.typeId.eval(ctx);
		var selector = '(' + this.plist.list.map(function(x) {
			return x[0].name + (x[1] ? ':' : '')
		}).join('') + ')';

		if (!type.ctx) {
			type.ctx = new Context();
		}
		this.block = this.block.eval(ctx);
		type.ctx[selector] = this;
		//return this;
	};

	AST.Struct.prototype.eval = function(ctx) {
		var signature = '(' + this.members.map(function(x) {
			return x.key.name + ':'
		}).join('') + ')';

		// This is the constructor function that returns a value created
		// with the struct's parameters. It's bound to the struct's ctx.
		this.ctx[signature] = function() {
			var args = Array.prototype.slice.call(arguments);
			var values = {};
			for (var i = 0, len = this.members.length; i < len; i++) {
				values[this.members[i].key] = args[i];
			}
			var value = new AST.Value(this, values);
			value.ctx = new Context();
			value.ctx.__proto__ = this.ctx;
			return value;
		};

		return this;
	};

	AST.Option.prototype.eval = function(ctx) {
		this.values = {};
		this.ctx = new Context();
		for (var i = 0, len = this.variants.length; i < len; i++) {
			var name = this.variants[i].name;
			var tag = new AST.Tag(name);
			tag.ctx = new Context();
			tag.ctx.__proto__ = this.ctx;
			this.values[name] = tag;
		};
		return this;
	};

	AST.Tag.prototype.eval = function(ctx) {
		return this;
	};

	AST.Value.prototype.eval = function(ctx) {
		return this;
	};

	AST.Identifier.prototype.eval = function(ctx) {
		value = ctx[this.name];

		if (value === null || value === undefined) {
			var msg = (
				"the current module has no attribute '" + 
				this.name + "'"
			);
			throw new error.NameError(msg);  
		}

		value.tags['name'] = this.name;
		return value;
	};

	AST.KeyValuePair.prototype.eval = function(ctx) {
		ctx[this.key.eval(ctx)] = this.val.eval(ctx);
		return this;
	};

	AST.Dictionary.prototype.eval = function(ctx) {
		var newContext = {};
		var newKVL = [];

		for (var i = 0, len = this.kvl.length; i < len; i++) {
			var key = this.kvl[i].key;
			var value = this.kvl[i].val.eval(ctx);
			newContext[key] = value;
			newKVL.push(new AST.KeyValuePair(key, value));
		}

		var dict = new AST.Dictionary(newKVL, this.tags);
		dict.ctx = newContext;

		return dict;
	};

	AST.List.prototype.eval = function(ctx) {
		var list = this.list.map(function(n){ return n.eval(ctx); })
		return new AST.List(list, this.tags);
	};

	AST.Lookup.prototype.eval = function(ctx) {
		var target = this.target.eval(ctx);
		var result = [];
		var list, index;

		// Lookup integer indexes in lists or identifiers in dictionaries
		if (this.term.type === 'List') {
			list = this.term.list;
			for (var i = 0, len = list.length; i < len; i++) {
				index = list[i].eval(ctx);
				if (target.type === 'List') {
					if (index.type !== 'Integer') {
						return new AST.Bottom();
					}
					if (index.value < 0) {
						result.push(target.list[target.list.length + index.value]
							|| new AST.Bottom()
						);
					} else {
						result.push(target.list[index.value] || new AST.Bottom());
					}
				} else if (target.type === 'Dictionary') {
					//TODO: Test that index is hashable
					result.push(target.ctx[index] || new AST.Bottom());
				} else if (target.type === 'String') {
					if (index.type !== 'Integer') {
						// THis is an error
					}
					if (index.value < 0) {
						index.value = target.value.length + index.value;
					}

					// This is a problem.. Pushing empty string? LOL
					result.push(target.value[index.value] || '');
				}
			}
		} else if (this.term.type === 'Identifier' || this.term.type === 'Option') {
			if (!(this.term.name in target.values)) {
				var msg = (
					"'" + target.tags['name'] + "' has no attribute '" + 
					this.term.name + "'"
				);
				throw new error.NameError(msg);
			}
			var value = target.values[this.term.name].eval(ctx);
			value.tags.type = target.tags.name || '';
			// TODO: Return a copy since the tag name gets overwritten?
			return value;
		}

		if (target.type === 'String') {
			return new AST.String(result.join(''));
		} else {
			return new AST.List(result);
		}
	};

	AST.String.prototype.eval = function(ctx) {
		return this;
	};

	AST.Integer.prototype.eval = function(ctx) {
		return this;
	};

	AST.Rational.prototype.simplify = function(ctx) {
		var x = gcd(this.numerator, this.denominator);
		return new AST.Rational(
			this.numerator / x,
			this.denominator / x
		);
	};

	AST.Rational.prototype.eval = function(ctx) {
		// Simplify the fraction first
		return this.simplify(ctx);
	};

	AST.Decimal.prototype.eval = function(ctx) {
		return this;
	};

	AST.Scientific.prototype.eval = function(ctx) {
		return this;
	};

	AST.Imaginary.prototype.eval = function(ctx) {
		return this;
	};

	AST.Complex.prototype.eval = function(ctx) {
		return this;
	};

	AST.Bottom.prototype.eval = function(ctx) {
		return this;
	};
})(AST);
