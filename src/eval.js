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
	
	/*AST.ExpressionList.prototype.eval = function(ctx) {
		var vals = this.list.map(function(item) {
			return item.eval && item.eval(ctx) || new AST.Bottom();
			// if ('eval' in item.prototype) {
			// 	return item.eval(ctx);
			// } else {
			// 	return new L.AST.Bottom();
			// }
		});
		return vals.last();
	};*/

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
		let msg, expr, name;
		/*if (this.op === '::') {
			// Special case for assignment. Probably make this a macro at
			// some point, but not now bc I need assignment and I haven't
			// built macros yet.
			expr = new AST.Assignment({template: this.lhs, value: this.rhs.eval(ctx)});
		} else {*/
		let target = this.lhs.eval(ctx);
		let selector = I.List([new AST.KeyValuePair({key: "'='", val: this.rhs.eval(ctx)})]);
		return (new AST.Invocation({target: target, plist: selector})).eval(ctx);
	};

	AST.Assignment.prototype.eval = function(ctx) {
		// Recursively descend through the template, matching value equivalence
		// between template and evaluated right-hand expression and capturing
		// values into identifier placeholders in the template.
		let capture = function(match, value, ctx) {
			if (ctx === null) { return null; }

			if (match._name === 'List') {
				// TODO: Eventually add support for maps. (How?)
				if (value._name !== 'List') { return null; }

				// Test the first value.
				let [first, rest] = [match.items.first(), match.items.rest()];

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
						let last = match.items.last();

						if (last._name === 'Identifier' && last.getIn(['tags', 'collect'], false)) {
							// TODO: Should this really be an exception?
							return null;
						}

						let innerCtx = capture(last, value.items.last(), ctx);
						return innerCtx && capture(
							new AST.List({items: match.items.butLast(), tags: match.tags}),
							new AST.List({items: value.items.butLast(), tags: value.tags}),
							innerCtx
						);
					}
				}

				// capture([a] [*] -> {a: *}
				// capture([a, b], [*, *]) -> capture([b], [*]) + {a: *}
				// capture([a, b...], [*]) -> capture([b...], []) + {a: *}
				// capture([a, b..., c], [*, *..., *]) -> capture([b..., c], [*..., *]) + {a: *}
				if (rest.isEmpty() && value.items.count() === 1) {
					return ctx.set(first.label, value.items.first());
				} else {
					let innerCtx = capture(first, value.items.first(), ctx);
					return innerCtx && capture(
						new AST.List({items: rest, tags: match.tags}),
						new AST.List({items: value.items.rest(), tags: value.tags}),
						innerCtx
					);
				}
			} else if (match._name === 'Block') {
				if (value._name !== 'Block') { return null; }
				// TODO: The same strategy here.
			} else if (match._name === 'Identifier') {
				let type = match.getIn(['tags', 'type'], null);
				// TODO: Type check here.
				return ctx.set(match.label, value);
			} else {
				// This is where we test value equivalence
				// TODO: This should maybe call the equality method on the value
				// (but which side is the target and which is the argument?)
				let isEqual = (new AST.Invocation({
					target: value, plist: new AST.Message({
						___: _,
						___: match
					})
				})).eval(ctx);

				if (isEqual._name === 'Member' && isEqual.label === 'True') {
					return ctx;
				} else {
					return null;
				}
			}
		};

		let newCtx = capture(this.template.match, this.value.eval(ctx), I.Map({}));
		ctx.local = ctx.local.merge(newCtx);
		return newCtx && new AST.Map({items: newCtx.map(function(val, key) {
			return new AST.KeyValuePair({key: new AST.Symbol({label: key}), val: val});
		})});
	};

	AST.FunctionCall.prototype.eval = function(ctx) {
		let target = this.target.eval(ctx);
		let idents = target.plist.map(function(x) { return x.label; });

		if (this.plist.count() !== idents.count()) {
			throw new error.ArgumentError('mismatched arity');
		}

		let newCtx = new Context(I.Map(idents.zip(this.plist)), target.ctx);
		return (new AST.Evaluate({target: target.block})).eval(newCtx);
	};

	AST.Invocation.prototype.eval = function(ctx) {
		return new AST.Text({value: this.plist.items});
		var target = this.target.eval(ctx); // Should verify we got a function
		var func, local, params;

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
			local = {};

			func.plist.forEach(function(param) {
				local[param.name] = param.eval(ctx);
			});

			ctx = new Context(target.ctx, local);
			func = new AST.Function({plist: target.plist, block: target.block, ctx: ctx});

			// TODO: This isn't quite right.
			local.__proto__ = func.block.ctx;
			if (func.block.type === 'Function') {
				return func.block.eval(local);
			} else if (func.block.type === 'Block') {
				return func.block.expressionList.eval(local);
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
			return new AST.Block({exprs: target.expressionList.eval(ctx)});
		} else {
			// This is a method invocation LOL
			// Take the selector keys and string em together.
			// Dispatch will select on the type signature so get that right
			// when you define the ctx
			// > Thing: <s: Text>
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

			if (target.type === 'Record') {
				target.name = target.tags['name'];
			}

			console.log(target);
			var method = target.ctx.local.get(selector);
			
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
				return new AST.Text({value: 'Whoa! Not implemented!'});
			} else if (method && method.type === 'Method') {
				// (target.ctx[selector].type === 'Method') {
				if (target.type === 'Record' || target.type === 'Option') {
					throw new error.NotImplemented(
						"method invocations on types are not implemented"
					);
				}
				//var meth = target.ctx[selector];
				local = {};

				method.plist.list.forEach(function(param, key) {
					if (param[1]) {
						local[param[1].name] = this.plist.list.get(key).val.eval(ctx);
					}
				});

				local['this'] = target;

				func = new AST.Method({
					typeId: method.typeId,
					plist: method.plist,
					block: method.block,
					ctx: new Context(I.Map(local), target.ctx)
				});

				return func.block.expressionList.eval(local);
			} else {
				var msg = (
					"'" + target.name + "' does not have a method " +
					"matching the selector '" + selector + "'"
				);
				throw new error.NameError(msg);
			}
		}
	};
	
	AST.Evaluate.prototype.eval = function (ctx) {
		let target = this.target;

		if (target._name === 'Block') {
			let result = [];

			for (let exp of target.exprs) {
				let r = exp.eval && exp.eval(ctx) || new AST.Bottom();
				result.push(r);
			}

			return result.pop();
		} else {
			return target.eval(ctx);
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

		selector = lookup(this.message.identifier.label);

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
		return this.transform(function(node) {
			if (node._name === 'Evaluate') {
				return node.eval(ctx);
			} else {
				return node;
			}
		}).set('ctx', ctx);
	};

	AST.Match.prototype.eval = function(ctx) {
		var items = this.items.map(function(val) {
			return val.eval(ctx);
		});
		var predicates = items.map(function(val, key) {
			return I.List.of(ctx.match.curry(key), val);
		});
		return this.merge({
			// ctx: ctx,
			predicates: predicates,
			items: items
		})
	};

	AST.Parenthesized.prototype.eval = function (ctx) {
		return this.expr.eval(ctx);
	};

	AST.Block.prototype.eval = function(ctx) {
		// !!!! block.ctx.__proto__ = ctx;
		// TODO: Update the context. I need to figure out the right procedure
		// for this... 
		// Recursively search for prefix expressions with a '\' operator
		// and replace them with their evaluated value
		
		// transform(function (node) -> node) -> node
		return this.transform(function(node) {
			if (node._name === 'Evaluate') {
				return node.eval(ctx);
			} else {
				return node;
			}
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
				ctx.local[selector] = this;
				return ctx;
			});
		}
		// self = self.update('block', function(block) {
		// 	return block.eval(ctx);
		// });
		
		//return this;
	};

	AST.Record.prototype.eval = function(ctx) {
		var signature = '(' + this.members.map(function(x) {
			return x.key.name + ':'
		}).join('') + ')';

		// This is the constructor function that returns a value created
		// with the struct's parameters. It's bound to the struct's ctx.
		this.ctx.local = this.ctx.local.set(signature, function() {
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

	AST.Error.prototype.eval = function(ctx) {
		throw new error.ParseError(this.message);
	};

	AST.Identifier.prototype.eval = function(ctx) {
		var value = ctx.lookup(this.label);

		if (value === null || value === undefined) {
			var msg = (
				"the current module has no attribute '" + 
				this.label + "'"
			);
			throw new error.NameError(msg);  
		}

		return value.setIn(['tags', 'name'], this.label);
	};

	AST.Symbol.prototype.eval = function(ctx) {
		return this;
	};

	AST.KeyValuePair.prototype.eval = function(ctx) {
		// TODO: WHAT THE FUCK AM I DOING HERE?
		ctx.local = ctx.local.set(this.key.eval(ctx), this.val.eval(ctx));
		// ctx[this.key.eval(ctx)] = this.val.eval(ctx);
		return this;
	};

	AST.Map.prototype.eval = function(ctx) {
		var newContext = {};
		var newKVL = [];

		//for (var i = 0, len = this.kvl.length; i < len; i++) {
		this.items.forEach(function(kvp) {
			var value = kvp.val.eval(ctx);
			newContext[kvp.key] = value;
			newKVL.push(new AST.KeyValuePair({key: kvp.key, val: value}));
		});

		return new AST.Map({
			items: newKVL, ctx: new Context(null, newContext), tags: I.Map(this.tags)
		});
	};

	AST.List.prototype.eval = function(ctx) {
		var list = this.items.map(function(n){ return n.eval(ctx); });
		return new AST.List({items: list, tags: this.tags});
	};

	AST.ListAccess.prototype.eval = function(ctx) {
		var target = this.target.eval(ctx);
		var result = [];
		var list, index;

		// Lookup integer indexes in lists or identifiers in dictionaries
		for (let item of this.terms) {
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
			} else if (target._name === 'Map') {
				//TODO: Test that index is hashable
				result.push(target.ctx.local.get(index) || new AST.Bottom());
			} else if (target._name === 'Text') {
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
		}

		if (target.type === 'Text') {
			return new AST.Text({value: result.join('')});
		} else {
			return new AST.List({items: result});
		}
	};
	
	AST.PropertyLookup.prototype.eval = function (ctx) {
		if (this.term._name === 'Identifier' || this.term._name === 'Option') {
			if (!(this.term.label in target.values)) {
				let msg = (
					"'" + target.tags['name'] + "' has no attribute '" + 
					this.term.label + "'"
				);
				throw new error.NameError(msg);
			}
			let value = target.values[this.term.label]; //.eval(ctx);
			return value.setIn(['tags', 'type'], target.tags.label || '');
		}
	};

	AST.Text.prototype.eval = function(ctx) {
		return this;
	};

	AST.Integer.prototype.eval = function(ctx) {
		return this;
	};

	AST.Rational.prototype.simplify = function(ctx) {
		var x = gcd(this.numerator, this.denominator);
		return new AST.Rational({
			numerator: this.numerator / x,
			denominator: this.denominator / x
		});
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
