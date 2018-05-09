/*
    Invocation AST node
 */

const { Map, List, Record } = require('immutable');
const Value = require('./value');
const { NameError, NotImplemented } = require('../error');

const _ = null;
const _map = Map({});
const _list = List([]);


let Invocation = Record({target: _, plist: _list, tags: _map}, 'Invocation');

Invocation.prototype.toString = function () {
    return this.target.toString() + '(' + this.plist.map(function(it) {
        return it.toString();
    }).toArray().join(', ') + ')';
};

Invocation.prototype.repr = function(depth, style) {
    return this.target.repr(depth, style) + style.delimiter('(') +
        this.plist.map(function(it) {
            return it.repr(depth, style);
        }).toArray().join(style.delimiter(', ')) + style.delimiter(')');
};

Invocation.prototype.eval = function(ctx) {
	let target = this.target.eval(ctx);

	// This is a method invocation LOL
	// Take the selector keys and string em together.
	// Dispatch will select on the type signature so get that right
	// when you define the ctx
	// > Thing :: << Text s >>
	// > Thing t (reverse.) -> { t.s(reverse.) }
	// > t :: Thing(s: "stressed")
	// > t(reverse.)
	// 'desserts'

	var selector = '(' + this.plist.map(function(x) {
		if (x._name === 'KeyValuePair') {
			if (x.key._name === 'Identifier') {
				return x.key.label + ':';
			} else if (x.key._name === 'Operator') {
				return "'" + x.key.label + "':";
			}
		} else {
			if (x._name === 'Identifier') {
				return x.label;
			} else if (x._name === 'Operator') {
				return "'" + x.label + "'";
			}
		}
	}).join('') + ')';
	var method;

	// Invocations on Records instantiate a value with field values
	// mapped to named parameters in the message
	if (target._name === 'Record') {
		return new Value({
			label: target.label,
			fields: Map(this.plist.map(function(kvp) {
				return [kvp.key.label, kvp.val.eval(ctx)];
			}))
		});
	}

	// Invocations on Variants redirect to the Union that defined them
	if (target._name === 'Variant') {
		// ...
		
	}

	var method = ctx.lookup(target._name).get(selector);

	if (method && typeof method === 'function') {
		// The selector is implemented as a built-in function.

		params = this.plist.filter(function (x) {
			return x._name === 'KeyValuePair';
		}).map(function(x) {
			return x.val.eval(ctx);
		}).toArray();
		//target.ctx.__proto__ = ctx;
		return method.apply(target, params) || new AST.Bottom();

	} else if (method && method.type === 'Function') {
		//target.ctx[selector].type === 'Function') {
		throw new NotImplemented(
			"The Function '" + target.name + selector + " cannot be invoked"
		);

	} else if (method && method.type === 'Method') {
		// The selector's implementation is a declared method
		throw new NotImplemented(
			"The Method '" + target.name + selector + " cannot be invoked"
		);

		/*
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
			ctx: new Context({local: Map(local), outer: target.ctx})
		});

		return func.block.expressionList.eval(local);
		*/
	} else {
		var msg = (
			"'" + target.label + "' does not have a method " +
			"matching the selector '" + selector + "'"
		);
		throw new NameError(msg);
	}
};

Invocation.prototype.transform = function(xform) {
	return xform(this.update('target', function(target) {
		return (target && 'transform' in target) ? target.transform(xform) : xform(target);
	}).update('plist', function(plist) {
		return plist.map(function(kvp) {
			return kvp.update('val', function(val) {
				return (val && 'transform' in val) ? val.transform(xform) : xform(val);
			});
		});
	}));
};

module.exports = Invocation;
