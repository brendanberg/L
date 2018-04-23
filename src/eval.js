let AST = require('./ast');
let Context = require('./context');
let error = require('./error');
let I = require('immutable');

(function(AST) {
	// AST.Invocation.prototype.eval = function(ctx) {
	// 	return new AST.Text({value: this.plist.items});
	// 	var target = this.target.eval(ctx); // Should verify we got a function
	// 	var func, local, params;

	// 	function clone(obj) {
	// 		if (obj === null || typeof obj !== 'object') { return obj; }
	// 		var copy = obj.constructor() || {};
	// 		for (var attr in obj) {
	// 			if (obj.hasOwnProperty(attr)) { copy[attr] = obj[attr]; }
	// 		}
	// 		return copy;
	// 	}

	// 	if (target.type === 'Function') {
	// 		var ctx;
	// 		//clone(target.ctx);
	// 		local = {};

	// 		func.plist.forEach(function(param) {
	// 			local[param.name] = param.eval(ctx);
	// 		});

	// 		ctx = new Context(target.ctx, local);
	// 		func = new AST.Function({plist: target.plist, block: target.block, ctx: ctx});

	// 		// TODO: This isn't quite right.
	// 		local.__proto__ = func.block.ctx;
	// 		if (func.block.type === 'Function') {
	// 			return func.block.eval(local);
	// 		} else if (func.block.type === 'Block') {
	// 			return func.block.expressionList.eval(local);
	// 		}
	// 	} else if (target.type === 'Match') {
	// 		
	// 		for (let p of target.predicates) {
	// 			//

	// 		}
	// 		/*func = target.update('ctx', function(ctx) {
	// 			return new Context(func.ctx);
	// 		});

	// 		var predicates;
	// 		var result = null;
	// 		params = this.plist.list.map(function(x) { return x.eval(ctx) });
	// 		// for(var i in predicates) {
	// 		func.predicates.forEach(function(pred) {
	// 			var pair = pred;
	// 			var context = null;
	// 			try {
	// 				context = pair[0].apply(null, params);
	// 			} catch (e) {
	// 				if (!(e instanceof error.MatchError)) {
	// 					throw e;
	// 				}
	// 			}
	// 			if (context) {
	// 				if (pair[1].has('ctx')) {
	// 					// TODO: This may involve a diamond inheritance topology?
	// 					if (context.outer != null) {
	// 						console.log("WHOA THERE CHECK OUT eval.js");
	// 					}
	// 					context.outer = pair[1].ctx;
	// 				}
	// 				if (pair[1]._name === 'Block') {
	// 					result = pair[1].expressionList.eval(context);
	// 				} else {
	// 					result = pair[1];
	// 				}
	// 				return false;//break;
	// 			} 
	// 		});
	// 		return result || new AST.Bottom();*/
	// 	} else if (target.type === 'Block') {
	// 		return new AST.Block({exprs: target.expressionList.eval(ctx)});
	// 	} else {
	// 		// This is a method invocation LOL
	// 		// Take the selector keys and string em together.
	// 		// Dispatch will select on the type signature so get that right
	// 		// when you define the ctx
	// 		// > Thing: <s: Text>
	// 		// > Thing(reverse) -> { this.s(reverse) }
	// 		// > t = Thing(s: "stressed")
	// 		// > t(reverse)
	// 		// 'desserts'
	// 		// var context = new Context(_, ctx);//clone(ctx);
	// 		var selector = '(' + this.plist.list.map(function(x) {
	// 			if (x._name === 'KeyValuePair') {
	// 				return x.key.name + ':';
	// 			} else {
	// 				return x.name;
	// 			}
	// 		}).join('') + ')';
	// 		var method;

	// 		if (target.type === 'Record') {
	// 			target.name = target.tags['name'];
	// 		}

	// 		console.log(target);
	// 		var method = target.ctx.local.get(selector);
	// 		
	// 		//console.log(JSON.stringify(target));
	// 		//console.log(JSON.stringify(target.ctx));

	// 		if (method === undefined) {
//// //////////
	// 			method = target.ctx.lookup(selector);
	// 		}

	// 		if (method && typeof method === 'function') {
	// 			console.log('calling a builtin');
	// 			console.log(this.plist.list);
	// 			params = this.plist.list.filter(function (x) {
	// 				return x._name === 'KeyValuePair';
	// 			}).map(function(x) {
	// 				return x.val.eval(ctx);
	// 			});
	// 			console.log(params);
	// 			console.log(method);
	// 			console.log(target);
//// /////////
	// 			//target.ctx.__proto__ = ctx;
	// 			return method.apply(target, params) || new AST.Bottom();
	// 		} else if (method && method.type === 'Function') {
	// 			//target.ctx[selector].type === 'Function') {
	// 			return new AST.Text({value: 'Whoa! Not implemented!'});
	// 		} else if (method && method.type === 'Method') {
	// 			// (target.ctx[selector].type === 'Method') {
	// 			if (target.type === 'Record' || target.type === 'Option') {
	// 				throw new error.NotImplemented(
	// 					"method invocations on types are not implemented"
	// 				);
	// 			}
	// 			//var meth = target.ctx[selector];
	// 			local = {};

	// 			method.plist.list.forEach(function(param, key) {
	// 				if (param[1]) {
	// 					local[param[1].name] = this.plist.list.get(key).val.eval(ctx);
	// 				}
	// 			});

	// 			local['this'] = target;

	// 			func = new AST.Method({
	// 				typeId: method.typeId,
	// 				plist: method.plist,
	// 				block: method.block,
	// 				ctx: new Context(I.Map(local), target.ctx)
	// 			});

	// 			return func.block.expressionList.eval(local);
	// 		} else {
	// 			var msg = (
	// 				"'" + target.name + "' does not have a method " +
	// 				"matching the selector '" + selector + "'"
	// 			);
	// 			throw new error.NameError(msg);
	// 		}
	// 	}
	// };
	
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

	AST.Record.prototype.eval = function(ctx) {
		var signature = '(' + this.members.map(function(x) {
			return x.label + ':'
		}).join('') + ')';

		// This is the constructor function that returns a value created
		// with the struct's parameters. It's bound to the struct's ctx.
        /*
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
        */
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

})(AST);
