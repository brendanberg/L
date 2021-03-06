/*
    Block AST node
*/

const { List, Map, Record } = require('immutable');
const Context = require('../context');
const Bottom = require('./bottom');
const _ = null;
const _list = List([]);
const _map = Map({});


let Block = Record({exprs: _list, context: {}, closures: _map, scope: _, tags: _map}, 'Block');

Block.prototype.toString = function() {
	let join = (this.exprs.count() > 1) ? '\n' : ' ';
	if (this.getIn(['tags', 'source']) === 'module') { 
		return this.exprs.map(function(node) {
			return node.toString();
		}).join('\n');
	} else {
		return '{' + join + this.exprs.map(function(it) {
			return it.toString();
		}).join('\n') + join + '}';
	}
};

Block.prototype.repr = function(depth, style) {
	let join = (this.exprs.count() > 1) ? '\n' : ' ';
	let indent = (this.exprs.count() > 1) ? '    ' : '';
	let exps = this.exprs.map(function(it) {
		return it.repr(depth, style);
	});

	if (this.getIn(['tags', 'source']) === 'module') {
		return exps.join('\n').replace(/\n/g, '\n    ');
	} else {
		return (
			style.delimiter('{') + join + indent +
			exps.join('\n').replace(/\n/g, '\n    ') + join +
			style.delimiter('}')
		);
	}
};

Block.prototype.eval = function(ctx) {
	// Recursively search for prefix expressions with a '\' operator
    // and replace them with their evaluated value
	// TODO: Figure out the right evaluation semantics for `\`
	//       operators in nested blocks
	// TODO: This needs to be a depth-first traversal?
	const context = {}; //new Context(ctx);
	const block = this.transform((node) => {
		return node._name === 'Immediate' ? node.eval(ctx)[0] : node;
	});

	this.closures.forEach((outer, local) => {
		context[local] = ctx.get(outer);//.setLocal(local, ctx.get(outer));
	});

	return [block.set('context', context), ctx];
};

Block.prototype.invoke = function(ctx, pushContext) {
	if (pushContext === undefined) { pushContext = true; }
	let newCtx;

	if (pushContext) {
		newCtx = new Context(null, this.context);
		if (newCtx !== ctx) { newCtx.outer = ctx; } else {
			console.log('circular contexts: ', this);
		}
	} else {
		newCtx = ctx;
	}

	const result = this.exprs.reduce((result, exp) => {
		let evaluated;

		if (!exp.eval) {
			return result.push(new Bottom({scope: this.scope}));
		} else {
			let evaluated_expr = exp.eval(newCtx);
			if (evaluated_expr == null) { console.log(exp) };
			[evaluated, newCtx] = evaluated_expr;
			return result.push(evaluated);
		}
	}, List([])).last();
	
	return [result, ctx];
};

Block.prototype.transform = function(func) {
	return func(this.update('exprs', (exprs) => {
		return exprs.map((expr) => {
			return (expr && 'transform' in expr) ? expr.transform(func) : func(expr);
		});
	}));
};

module.exports = Block;
