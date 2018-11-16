/*
    Invocation AST node
 */

const { Map, List, Set, Record } = require('immutable');
const Record_ = require('./record');
const Bottom = require('./bottom');
const List_ = require('./list');
const Immediate = require('./immediate');
const Identifier = require('./identifier');
const { NameError, NotImplemented } = require('../error');
const Context = require('../context');

const _ = null;
const _map = Map({});
const _list = List([]);


let Invocation = Record({target: _, selector: _, args: _list, scope: _, tags: _map}, 'Invocation');

Object.defineProperty(Invocation.prototype, 'scopes', {
	get() { return this._scopes || Set([]); },
	set(scopes) { this._scopes = scopes; }
});

Invocation.prototype.toString = function () {
    return this.target.toString() + '(' + this.args.map(function(it) {
        return it.toString();
    }).toArray().join(', ') + ')';
};

Invocation.prototype.repr = function(depth, style) {
    return this.target.repr(depth, style) + style.delimiter('(') +
        this.args.map(function(it) {
            return it.repr(depth, style);
        }).toArray().join(style.delimiter(', ')) + style.delimiter(')');
};

Invocation.prototype.eval = function(ctx) {
	let target = this.target.eval(ctx);
	let context;
	// This is a method invocation LOL
	// Take the selector keys and string em together.
	// Dispatch will select on the type signature so get that right
	// when you define the ctx
	// > Thing << Text s >>
	// > Thing t (.reverse) -> { t.s(.reverse) }
	// > t :: Thing(s: "stressed")
	// > t(.reverse)
	// 'desserts'

	// Invocations on Records instantiate a value with field values
	// mapped to named parameters in the message
	if (target._name === 'RecordType') {
		let fields = Map(this.args.map(function(kvp) {
				return [kvp.key.label, kvp.val.eval(ctx)];
			}));
		let value = new Record_({
			label: target.label,
			fields: fields,
			scope: this.scope
		});
		// TODO: filter bad values

		return value;
	} else if (target._name === 'Tuple') {
		// TODO: verify arity and type check...
		return new Tuple({
			label: target.label,
			values: this.args.map((item) => { return item.eval(ctx); }),
			scope: this.scope
		});
	}

	let method;
	let scope = Symbol();

	if (target._name === 'Record') {
		method = ctx.get(target.binding).methodForSelector(this.selector);
	} else if (target._name === 'Symbol') {
		let type = target.getIn(['tags', 'typebinding']);
		method = ctx.get(type).methodForSelector(this.selector);
	} else if (target._name === 'Function') {
		let args = new List_({
			items: this.args.map((item) => { return item.eval(ctx) }),
			scope: this.scope
		});
		let match = ctx.match(target.template, args);
		
		if (match) {
			let [testCtx, locals] = match; 

			if (target.guard) {
				// Don't need to flush here since everything should be local.
				let guard = target.guard.eval(testCtx);
	
				if (!(guard._name == 'Symbol' && guard.label == 'True')) {
					return new Bottom({scope: this.scope});
				}
			}
			context = testCtx;
			method = target.block;
		} else {
			return new Bottom({scope: this.scope});
		}
	} else if (target._name === 'HybridFunction') {
		// TODO: Implement a more efficient pattern matching algorithm
		// Currently, we just iterate over the predicates and stop when
		// we find a template that matches the argument list.
		let args = new List_({
			items: this.args.map((item) => { return item.eval(ctx) }),
			scope: this.scope
		});

		for (let predicate of target.predicates) {
			// console.log('pred', predicate);
			// console.log('args', args);
			let match  = ctx.match(predicate.template, args);

			if (match) {
				let [testCtx, locals] = match;
				if (predicate.guard) {
					let guard = predicate.guard.eval(testCtx);

					if (guard._name === 'Symbol' && guard.label === 'True') {
						context = testCtx;
						method = predicate.block;
						break;
					}
				} else {
					context = testCtx;
					method = predicate.block;
					break;
				}
			}
		}

		if (!method) { return new Bottom({scope: this.scope}); }
	} else if (target._name === 'Block') {
		context = new Context(ctx);
		context.scope = ctx.scope;
		method = target;
	} else if (target.has('binding')) {
		//let ident = new Identifier({label: target._name, scope: this.scope})
		//ident.scopes = Set([]);
		// TODO: HOW DO WE RESOLVE EVERY TYPE BEFORE RUNTIME?!
		//console.log("HOLY FUCK WHAT'S HAPPENING");
		// TODO: Verify that this is correct!
		method = ctx.get(target.binding).methodForSelector(this.selector);
	} else if (target.hasIn(['tags', 'typebinding'])) {
		method = ctx.get(target.getIn(['tags', 'typebinding'])).methodForSelector(this.selector);
	}

	if (method && method._name === 'Block') {
		// Block invocation (either function, hybrid function, or bare block)
		if (context) {
			context.flush();
			return method.invoke(context);
		} else {
			// TODO: note the reason for the failed match
			return new Bottom({scope: this.scope});
		}
	} else if (method && typeof method === 'function') {
		// The selector is implemented as a built-in function.

		let params = this.args.filter(function (x) {
			return x._name === 'KeyValuePair';
		}).map(function(x) {
			return x.val.eval(ctx);
		}).toArray();
		// Nasty hack to get method invocations to work within method built-ins
		if (!target.has('ctx')) { target.ctx = ctx };
		return method.apply(target, params) || new Bottom({scope: this.scope});

	} else if (method && method._name === 'Function') {
		// The selector is implemented as a function generated by evaluating
		// a method declaration

		let impl = method.eval(ctx);

		let args = this.args.filter((item) => {
			return item._name == 'KeyValuePair';
		}).map((item) => {
			return item.val.eval(ctx);
		}).insert(0, target);

		let [context, locals] = ctx.match(impl.template, new List_({
			items: args, scope: this.scope
		}));

		if (context) {
			context.flush();
			return impl.block.invoke(context);
		} else {
			return new Bottom({scope: this.scope});
		}
	} else {
		var msg = (
			"the " + target._name + " '" + target.toString() + "' does not have a method " +
			"matching the selector '" + this.selector + "'"
		);
		throw new NameError(msg);
	}
};

Invocation.prototype.transform = function(xform) {
	let inv = xform(this.update('target', function(target) {
		return (target && 'transform' in target) ? target.transform(xform) : xform(target);
	}).update('args', function(args) {
		return args.map(function(item) {
			if (item._name === 'KeyValuePair') {
				return item.update('val', function(val) {
					return (val && 'transform' in val) ? val.transform(xform) : xform(val);
				});
			} else {
				return (item && 'transform' in item) ? item.transform(xform) : xform(item);
			}
		});
	}));

	inv.scopes = this.scopes;
	return inv;
};

module.exports = Invocation;
