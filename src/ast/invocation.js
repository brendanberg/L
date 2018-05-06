/*
    Invocation AST node
 */

const { Map, List, Record } = require('immutable');
const Value = require('./value');
const { NameError } = require('../error');

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
	// > Thing t (reverse!) -> { t.s(reverse!) }
	// > t :: Thing(s: "stressed")
	// > t(reverse!)
	// 'desserts'
	// var context = new Context(_, ctx);//clone(ctx);
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

	if (target._name === 'Record') {
		return new Value({
			label: target.label,
			fields: Map(this.plist.map(function(kvp) {
				return [kvp.key.label, kvp.val.eval(ctx)];
			}))
		});
	}

	var method = ctx.lookup(target._name).get(selector);

	/*if (method === undefined) {
		method = target.ctx.lookup(selector);
	}*/

	if (method && typeof method === 'function') {
		params = this.plist.filter(function (x) {
			return x._name === 'KeyValuePair';
		}).map(function(x) {
			return x.val.eval(ctx);
		}).toArray();
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
			ctx: new Context({local: Map(local), outer: target.ctx})
		});

		return func.block.expressionList.eval(local);
	} else {
		console.log('method', method);
		console.log('selector', selector);
		var msg = (
			"'" + target.name + "' does not have a method " +
			"matching the selector '" + selector + "'"
		);
		throw new NameError(msg);
	}
}

module.exports = Invocation;
