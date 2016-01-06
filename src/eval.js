var AST = require('./ast');
var Context = require('./context');
var error = require('./error');
var I = require('immutable');

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
		var vals = this.list.map(function(item) {
			return item.eval && item.eval(ctx) || new AST.Bottom();
			// if ('eval' in item.prototype) {
			// 	return item.eval(ctx);
			// } else {
			// 	return new L.AST.Bottom();
			// }
		});
		return vals.last();
	};

	AST.PrefixExpression.prototype.eval = function (ctx) {
		var exp = this.exp.eval(ctx);
		// console.log("'\\'", exp.ctx["'\\'"]);
		// console.log('OP: ', this.op);
		// console.log(exp.ctx["'" + this.op + "'"]);
		var ident = new AST.Identifier({name: "('" + this.op + "')"});
		var params = new AST.List({
			list: I.List([ident]),
			tags: I.Map({source: 'parameterList'})
		});
		var invocation = new AST.Invocation({target: exp, plist: params});
		//console.log(invocation.toString());
		return invocation.eval(ctx);
	};

	AST.InfixExpression.prototype.eval = function (ctx) {
		var msg, expr, name;
		if (this.op === ':') {
			// Special case for assignment. Probably make this a macro at
			// some point, but not now bc I need assignment and I haven't
			// built macros yet.
			expr = new AST.Assignment({identifier: this.lhs, value: this.rhs.eval(ctx)});
		} else {
			var exp = this.lhs.eval(ctx);
			var p0 = new AST.KeyValuePair({
				key: new AST.Identifier({name: "'" + this.op + "'"}),
				val: this.rhs.eval(ctx)
			});
			var params = new AST.List({
				list: I.List([p0]),
				tags: I.Map({source: 'parameterList'})
			});
			expr = new AST.Invocation({target: exp, plist: params});
		}

		return expr.eval(ctx);
	};

	AST.Assignment.prototype.eval = function(ctx) {
		// The assignment operator in the context updates the context and
		// returns the match dictionary.
		var matchDict = ctx[':'].call(ctx, this.identifier, this.value);
		var newCtx = {};
		for (var i in matchDict) {
			newCtx[AST.Identifier({name: i})] = matchDict[i];
		}
		
		return I.Map(newCtx);
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
			var ctx;
			//clone(target.ctx);
			locals = {};

			func.plist.forEach(function(param) {
				locals[param.name] = param.eval(ctx);
			});

			ctx = new Context(target.ctx, locals);
			func = new AST.Function({plist: target.plist, block: target.block, ctx: ctx});

			// TODO: This isn't quite right.
			locals.__proto__ = func.block.ctx;
			if (func.block.type === 'Function') {
				return func.block.eval(locals);
			} else if (func.block.type === 'Match') {
				return func.block.eval(locals);
			} else if (func.block.type === 'Block') {
				return func.block.expressionList.eval(locals);
			}
		} else if (target.type === 'Match') {
			func = target.update('ctx', function(ctx) {
				return new Context(func.ctx);
			});

			var predicates;
			var result = null;
			params = this.plist.list.map(function(x) { return x.eval(ctx) });
			// for(var i in predicates) {
			func.predicates.forEach(function(pred) {
				var pair = pred;
				var context = null;
				try {
					context = pair[0].apply(null, params);
				} catch (e) {
					if (!(e instanceof error.MatchError)) {
						throw e;
					}
				}
				if (context) {
					if (pair[1].has('ctx')) {
						// TODO: This may involve a diamond inheritance topology?
						if (context.outer != null) {
							console.log("WHOA THERE CHECK OUT eval.js");
						}
						context.outer = pair[1].ctx;
					}
					if (pair[1]._name === 'Block') {
						result = pair[1].expressionList.eval(context);
					} else {
						result = pair[1];
					}
					return false;//break;
				} 
			});
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
			// var context = new Context(_, ctx);//clone(ctx);
			var selector = '(' + this.plist.list.map(function(x) {
				if (x._name === 'KeyValuePair') {
					return x.key.name + ':';
				} else {
					return x.name;
				}
			}).join('') + ')';
			var method;

			if (target.type === 'Struct') {
				target.name = target.tags['name'];
			}

			console.log(target);
			var method = target.ctx.locals.get(selector);
			
			//console.log(JSON.stringify(target));
			//console.log(JSON.stringify(target.ctx));

			if (method === undefined) {
////////////
				method = target.ctx.lookup(selector);
			}

			if (method && typeof method === 'function') {
				console.log('calling a builtin');
				console.log(this.plist.list);
				params = this.plist.list.filter(function (x) {
					return x._name === 'KeyValuePair';
				}).map(function(x) {
					return x.val.eval(ctx);
				});
				console.log(params);
				console.log(method);
				console.log(target);
///////////
				//target.ctx.__proto__ = ctx;
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
				locals = {};

				method.plist.list.forEach(function(param, key) {
					if (param[1]) {
						locals[param[1].name] = this.plist.list.get(key).val.eval(ctx);
					}
				});

				locals['this'] = target;

				func = new AST.Method({
					typeId: method.typeId,
					plist: method.plist,
					block: method.block,
					ctx: new Context(I.Map(locals), target.ctx)
				});

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
				var selector = recv.ctx.lookup(name);
				// get(name);

				// if (selector === undefined) {
				// 	selector = recv.__proto__.ctx[name];
				// }

				return selector;
			};
		} else {
			lookup = function(name) { return ctx.lookup(name); };
		}

		selector = lookup(this.message.identifier.name);

		if (selector && typeof selector === 'function') {
			var evaluate = function (x) { return x.eval(ctx) };
			return selector.apply(this.receiver, this.message.plist.list.map(evaluate));
		} else if (selector && selector.type === 'Function') {
			// Eval the function ugh
			var scope;

			if (selector.plist.size !== this.message.plist.size) {
				throw 'function signatures do not match';
			}

			scope = clone(selector.ctx);

			selector.plist.forEach(function(param, idx) {
				scope[param.name] = this.message.plist.list.get(idx).eval(ctx);
			});
			// for (var i = 0, len = selector.plist.list.length; i < len; i++) {
			// 	scope[selector.plist.list[i].name] = this.message.plist.list[i].eval(ctx);
			// }

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
		return this.update('block', function(block) {
			return block.eval(ctx);
		});
	};

	AST.Match.prototype.eval = function(ctx) {
		var kvlist = this.kvlist.map(function(val) {
			return val.eval(ctx);
		});
		var predicates = kvlist.map(function(val, key) {
			return I.List.of(ctx.match.curry(key), val);
		});
		return this.merge({
			// ctx: ctx,
			predicates: predicates,
			kvlist: kvlist
		})
	};

	AST.Block.prototype.eval = function(ctx) {
		// !!!! block.ctx.__proto__ = ctx;
		// TODO: Update the context. I need to figure out the right procedure
		// for this... 
		// Recursively search for prefix expressions with a '\' operator
		// and replace them with their evaluated value
		return this.update('explist', function(explist) {
			return explist.transform(function(node) {
				if (node._name === 'PrefixExpression' && node.op === '\\') {
					return node.exp.eval(ctx);
				} else {
					return node;
				}
			});
		});
	};

	AST.Method.prototype.eval = function(ctx) {
		// This is kind of a weird one because methods are declarative and
		// operate on a type defined in the package context. Importing the
		// type will also import its context I guess

		// 1. Find the type identifier in the current context. 
		//    (if it doesn't exist, create it.)
		// 2. Update the type's context with the method's selector
		//    and body.

		var typeId = this.typeId.eval(ctx);
		var selector = '(' + this.plist.list.map(function(x) {
			return x[0].name + (x[1] ? ':' : '')
		}).join('') + ')';

		var type = ctx.lookup(typeId.name);

		if (type && type.has('ctx')) {
			type = type.update('ctx', function(ctx) {
				ctx.locals[selector] = this;
				return ctx;
			});
		}
		// self = self.update('block', function(block) {
		// 	return block.eval(ctx);
		// });
		
		//return this;
	};

	AST.Struct.prototype.eval = function(ctx) {
		var signature = '(' + this.members.map(function(x) {
			return x.key.name + ':'
		}).join('') + ')';

		// This is the constructor function that returns a value created
		// with the struct's parameters. It's bound to the struct's ctx.
		this.ctx.locals = this.ctx.locals.set(signature, function() {
			var args = Array.prototype.slice.call(arguments);
			var values = {};
			this.members.forEach(function(member, idx) {
				values[member.key] = args[idx];
			});
			return new AST.Value({
				mommy: this, values: values, ctx: new Context(this.ctx)
			});
		});

		return this;
	};

	AST.Option.prototype.eval = function(ctx) {
		var values = {};
		//!!! this.ctx = new Context();
		this.variants.forEach(function(variant) {
			values[variant.name] = new AST.Tag({
				name: variant.name,
				ctx: ctx
			});
		});
		
		return this.set('ctx', I.Map(values));
	};

	AST.Tag.prototype.eval = function(ctx) {
		return this;
	};

	AST.Value.prototype.eval = function(ctx) {
		return this;
	};

	AST.Identifier.prototype.eval = function(ctx) {
		var value = ctx.locals.get(this.name);

		if (value === null || value === undefined) {
			var msg = (
				"the current module has no attribute '" + 
				this.name + "'"
			);
			throw new error.NameError(msg);  
		}

		return value.setIn(['tags', 'name'], this.name);
	};

	AST.KeyValuePair.prototype.eval = function(ctx) {
		// TODO: WHAT THE FUCK AM I DOING HERE?
		ctx.locals = ctx.locals.set(this.key.eval(ctx), this.val.eval(ctx));
		// ctx[this.key.eval(ctx)] = this.val.eval(ctx);
		return this;
	};

	AST.Dictionary.prototype.eval = function(ctx) {
		var newContext = {};
		var newKVL = [];

		//for (var i = 0, len = this.kvl.length; i < len; i++) {
		this.kvlist.forEach(function(kvp) {
			var value = kvp.val.eval(ctx);
			newContext[kvp.key] = value;
			newKVL.push(new AST.KeyValuePair(kvp.key, value));
		});

		return new AST.Dictionary({
			kvlist: newKVL, ctx: new Context(null, newContext), tags: I.Map(this.tags)
		});
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
			// list = this.term.list;
			// for (var i = 0, len = list.length; i < len; i++) {
			this.term.list.forEach(function(item, idx) {
				index = item.eval(ctx);
				if (target._name === 'List') {
					if (index._name !== 'Integer') {
						return new AST.Bottom();
					}
					if (index.value < 0) {
						result.push(
							target.list.get(target.list.size + index.value) ||
							new AST.Bottom()
						);
					} else {
						result.push(target.list.get(index.value) || new AST.Bottom());
					}
				} else if (target._name === 'Dictionary') {
					//TODO: Test that index is hashable
					result.push(target.ctx.locals.get(index) || new AST.Bottom());
				} else if (target._name === 'String') {
					if (index._name !== 'Integer') {
						// TODO: THis is an error
					}
					if (index.value < 0) {
						index.value = target.value.length + index.value;
					}

					// This is a problem.. Pushing empty string? LOL
					// TODO: Should the default be Bottom()?
					result.push(target.value[index.value] || '');
				}
			});
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

	AST.Complex.prototype.eval = function(ctx) {
		return this;
	};

	AST.Bottom.prototype.eval = function(ctx) {
		return this;
	};
})(AST);
