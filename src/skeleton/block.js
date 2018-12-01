
const { Map, List, Record } = require('immutable');
const _ = null;
const _map = Map({});
const _list = List([]);
const log = require('loglevel');


const Context = require('../context');
const AST = require('../ast');

Block = Record({exprs: _list, tags: _map}, 'Block');

Block.prototype.transform = function(xform) {
	// Create a new execution context for the block and recursively
	// call transform on each of the expressions in the block.

	// N.B.: Blocks are the only valid place to define a macro
	// expression. A macro defined in a block is accessible
	// anywhere in the block, so this needs two passes basically.

	let args = Array.prototype.slice.call(arguments, 1);
	args.splice(0, 0, this);
	let transformed = xform.apply(null, args);
	if (!transformed) { return null; }

	let [exprs, __, scope] = transformed;
	return [exprs, scope];
};

module.exports = Block;

