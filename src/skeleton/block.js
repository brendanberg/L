
const { Map, List, Record } = require('immutable');
const _ = null;
const _map = Map({});
const _list = List([]);


const Context = require('../context');
const AST = require('../ast');

Block = Record({exprs: _list, tags: _map}, 'Block');

Block.prototype.transform = function(context, match) {
	// Create a new execution context for the block and recursively
	// call transform on each of the expressions in the block.

	// N.B.: Blocks are the only valid place to define a macro
	// expression. A macro defined in a block is accessible
	// anywhere in the block, so this needs two passes basically.

	let subcontext = new Context({local: _map, outer: context});
	// TODO: Currently the context and match are mutable, but
	// they should probably be made immutable.
	let exprs = this.exprs.reduce(function(result, expr)  {
		if (result === null) { return null; }

		let exp = expr.transform(subcontext, match);
		return exp ? result.push(exp) : null;
	}, List([]));

	return new AST.Block({
		exprs: exprs,
		ctx: subcontext,
		tags: this.tags
	});
};

module.exports = Block;

