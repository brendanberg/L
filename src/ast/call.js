/*
    Call AST node
 */

const { Map, List, Set, Record } = require('immutable');
const Record_ = require('./record');
const Bottom = require('./bottom');
const List_ = require('./list');
const Immediate = require('./immediate');
const Identifier = require('./identifier');
const { NameError, NotImplemented } = require('../error');
const Context = require('../context');
const resolve = require('../resolve');

const _ = null;
const _map = Map({});
const _list = List([]);


let Call = Record({target: _, selector: _, args: _list, scope: _, tags: _map}, 'Call');

Call.prototype.toString = function () {
    return this.target.toString() + '(' + this.args.map(function(it) {
        return it.toString();
    }).toArray().join(', ') + ')';
};

Call.prototype.repr = function(depth, style) {
    return this.target.repr(depth, style) + style.delimiter('(') +
        this.args.map(function(it) {
            return it.repr(depth, style);
        }).toArray().join(style.delimiter(', ')) + style.delimiter(')');
};

Call.prototype.eval = function(ctx) {
	let target = this.target.eval(ctx)[0];
	let context;
	// This is a method invocation LOL
	// Take the selector keys and string em together.
	// Dispatch will select on the type signature so get that right
	// when you define the ctx
	// > Thing << Text s >>
	// > Thing t (.reverse) -> { t.s(reverse.) }
	// > t :: Thing(s: "stressed")
	// > t(reverse.)
	// 'desserts'

	// Call on Records instantiate a value with field values
	// mapped to named parameters in the message
	if (target._name === 'RecordType') {
		let fields = Map(this.args.map(function(kvp) {
				return [kvp.key.label, kvp.val.eval(ctx)[0]];
			}));
		let value = new Record_({
			label: target.label,
			fields: fields,
			scope: this.scope,
			tags: Map({type: target.label, typebinding: target.binding}),
		});
		// TODO: filter bad values

		return [value, ctx];
	} else if (target._name === 'Tuple') {
		// TODO: verify arity and type check...
		let tuple = new Tuple({
			label: target.label,
			values: this.args.map((item) => { return item.eval(ctx)[0]; }),
			scope: this.scope,
			tags: Map({typebinding: target.binding}),
		});

		return [tuple, ctx];
	}

	let method;
	let scope = Symbol();

	if (target._name === 'Record') {
		const type = target.getIn(['tags', 'typebinding']);
		method = ctx.get(type).methodForSelector(this.selector);
	} else if (target._name === 'Symbol') {
		let type = target.getIn(['tags', 'typebinding']);
		method = ctx.get(type).methodForSelector(this.selector);
	} else if (target._name === 'Function') {
		let args = new List_({
			items: this.args.map((item) => { return item.eval(ctx)[0] }),
			scope: this.scope
		});

		let invocationContext = new Context(ctx, target.block.context);
		let match  = invocationContext.match(target.template, args);
		//let match = target.block.context.match(target.template, args);
		
		if (match) {
			//let argstr = args.items.map((x) => x.toString()).toJS().join(', ');
			//console.log(this.target + '(' + argstr + ')');
			let [testCtx, locals] = match; 

			if (target.guard) {
				// Don't need to flush here since everything should be local.
				let guard = target.guard.eval(testCtx)[0];
	
				if (!(guard._name == 'Symbol' && guard.label == 'True')) {
					return [new Bottom({scope: this.scope}), ctx];
				}
			}
			context = testCtx;
			method = target.block;
		} else {
			return [new Bottom({scope: this.scope}), ctx];
		}
	} else if (target._name === 'HybridFunction') {
		// TODO: Implement a more efficient pattern matching algorithm
		// Currently, we just iterate over the predicates and stop when
		// we find a template that matches the argument list.
		let args = new List_({
			items: this.args.map((item) => { return item.eval(ctx)[0] }),
			scope: this.scope
		});

		for (let predicate of target.predicates) {
			let invocationContext = new Context(ctx, predicate.block.context);
			let match  = invocationContext.match(predicate.template, args);

			if (match) {
				let [testCtx, locals] = match;
				if (predicate.guard) {
					let guard = predicate.guard.eval(testCtx)[0];

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

		if (!method) { return [new Bottom({scope: this.scope}), ctx]; }
		//let argstr = args.items.map((x) => x.toString()).toJS().join(', ');
		//console.log(this.target + '(' + argstr + ')');
	} else if (target._name === 'Block') {
		context = ctx;
		method = target;
	} else if (target.has('binding')) {
		//let ident = new Identifier({label: target._name, scope: this.scope})
		// TODO: HOW DO WE RESOLVE EVERY TYPE BEFORE RUNTIME?!
		// TODO: Verify that this is correct!
		method = ctx.get(target.binding).methodForSelector(this.selector);
	} else if (target.hasIn(['tags', 'typebinding'])) {
		//console.log(target.getIn(['tags', 'typebinding']));
		
		let tgt = ctx.get(target.getIn(['tags', 'typebinding']));

		if (!tgt) {
			console.log(target);
			console.log(target.getIn(['tags', 'typebinding']));
			console.log(ctx);
			console.log(this.selector);
		}
		method = ctx.get(target.getIn(['tags', 'typebinding'])).methodForSelector(this.selector);
	}

	if (method && typeof method === 'function') {
		// The selector is implemented as a built-in function.

		let params = this.args.filter((arg) => arg._name === 'KeyValuePair')
				.map((arg) => arg.val.eval(ctx)[0])
				.toArray();

		// Nasty hack to get method invocations to work within method built-ins
		// TODO: FIX THIS!
		if (!target.has('ctx')) { target.ctx = ctx };
		let ret = method.apply(target, params) || new Bottom({scope: this.scope}), bindings;
		//if (ctx.bindings == null) { console.log(ctx); }
		[ret, ctx.bindings] = resolve(ret, ctx.getBindings());
		[ret, ctx] = ret.eval(ctx);

		return [ret, ctx];

	} else if (method && method._name === 'Block') {
		// Block invocation (either function, hybrid function, or bare block)
		if (context) {
			return method.invoke(context);
		} else {
			// TODO: note the reason for the failed match
			return [new Bottom({scope: this.scope}), ctx];
		}
	} else if (method && method._name === 'Function') {
		// The selector is implemented as a function generated by evaluating
		// a method declaration

		let impl = method.eval(ctx)[0];

		let args = this.args.filter((item) => {
			return item._name == 'KeyValuePair';
		}).map((item) => {
			return item.val.eval(ctx)[0];
		}).insert(0, target);

		let [context, locals] = ctx.match(impl.template, new List_({
			items: args, scope: this.scope
		}));

		if (context) {
			return impl.block.invoke(context);
		} else {
			return [new Bottom({scope: this.scope}), ctx];
		}
	} else {
		var msg = (
			"the " + target._name + " '" + target.toString() + "' does not have a method " +
			"matching the selector '" + this.selector + "'"
		);
		throw new NameError(msg);
	}
};

Call.prototype.transform = function(xform) {
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

	return inv;
};

module.exports = Call;
