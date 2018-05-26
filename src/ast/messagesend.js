/*
   Function Call AST node
 */

const { Map, Record } = require('immutable');
const { NotImplemented } = require('../error');
const Immediate = require('./immediate');
const Bottom = require('./bottom');
const _ = null;
const _map = Map({});


let MessageSend = Record({sender: _, receiver: _, message: _, tags: _map}, 'MessageSend');

MessageSend.prototype.toString = function() {
	return (this.receiver ? this.receiver.toString() + '<-' : '') + this.message.toString();
};

MessageSend.prototype.repr = function(depth, style) {
	return this.toString();
};

MessageSend.prototype.eval = function(ctx) {
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
		throw new NotImplemented(
			"THIS ISN'T HOW WE DO METHOD INVOCATION ANYMORE");
		// Method evaluation is slightly different.
	} else {
		return selector;
	}
}

MessageSend.prototype.transform = function(func) {
    return func(this);
};

module.exports = MessageSend;

