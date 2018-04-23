/*
   Function Call AST node
 */

let I = require('immutable');

let Evaluate = require('./evaluate');
let Bottom = require('./bottom');

const _ = null;
const _map = I.Map({});
const _list = I.List([]);


let FunctionCall = I.Record({args: _list, target: _, tags: _map}, 'FunctionCall');

FunctionCall.prototype.toString = function() {
    return this.target.toString() + '(' + this.args.map(function(it) {
        return it.toString();
    }).toArray().join(', ') + ')';
};

FunctionCall.prototype.repr = function(depth, style) {
    return this.target.repr(depth, style) + '(' +
		console.log(this.args);
        this.args.map(function(it) {
            return it.repr(depth, style);
        }).toArray().join(', ') + ')';
};

FunctionCall.prototype.eval = function(ctx) {
	let target = this.target.eval(ctx);
	let args = this.args.eval(ctx);
	let block;
	let context;

	if (target._name === 'Function') {
		context = target.ctx.extend(target.template.match, args);
        // TODO: Perhaps the context needs to get attached to the block?
		block = target.block; // target.block.set('ctx', context);
	} else if (target._name === 'Match') {
		// TODO: Implement a more efficient pattern matching algorithm
		// Currently, we just iterate over the predicates and stop when
		// we find a template that matches the argument list.
		for (let predicate of target.predicates) {
			let testCtx = target.ctx.extend(predicate.template.match, args);
			if (testCtx) {
				context = testCtx;
				block = predicate.block;
				break;
			}
		}
	} else if (target._name === 'Record') {
        context = target.ctx;
        if (target.members.count() != args.count()) {
            throw ArgumentError('');
        }
        let properties = {};
        let members = target.members.map(function(x) { return x.label; });

        for (let [key, val] of members.zip(args.items)) {
            properties[key] = val;
        }

        return target.update('ctx', function (ctx) {
            return I.Map(properties);
        }).update('tags', function(tags) {
            return tags.set('name', target.label);
        });
    }

	if (context) {
		return (new Evaluate({target: block})).eval(context);
	} else {
		// TODO: note the reason for the failed match
		return new Bottom();
	}
}

FunctionCall.prototype.transform = function(func) {
    return func(this);
};

module.exports = FunctionCall;

