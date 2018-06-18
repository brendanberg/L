
const { Map, List, Record } = require('immutable');
const _ = null;
const _map = Map({});
const _list = List([]);
const log = require('loglevel');


const Context = require('../context');
const AST = require('../ast');

Block = Record({exprs: _list, tags: _map}, 'Block');

Block.prototype.transform = function(match, scopes) {
	// Create a new execution context for the block and recursively
	// call transform on each of the expressions in the block.

	// N.B.: Blocks are the only valid place to define a macro
	// expression. A macro defined in a block is accessible
	// anywhere in the block, so this needs two passes basically.

	let exprs, block = match.block(this, [], scopes.scope);
	if (!block) { return null; }

	[exprs, __, newScope] = block;
	scopes.scope = newScope;

	exprs = exprs.transform((node) => {
		if (node._name === 'Identifier' && node.binding == null) {
			if (node.getIn(['tags', 'introduction'])) {
				if (node.getIn(['tags', 'local'])) {
					node = node.set('binding', scopes.addBinding(node));
				} else {
					node = node.set('binding', scopes.resolve(node) || scopes.addBinding(node));
				}
				log.debug(`+ ${node.debugString()}`);
			} else {
				node = node.set('binding', scopes.resolve(node));
				if (node.binding) {
					 log.debug(`= ${node.debugString()}`);
				} else {
					 log.debug(`0 ${node.debugString()}`);
				}
			}
		} else if ((node._name === 'RecordType' || node._name === 'UnionType')
				&& node.binding == null) {
			node = node.set('binding', scopes.addBinding(node));
			log.debug(`+ ${node.debugString()}`);
		}

		return node;
	}).transform((node) => {
		if (node._name === 'Identifier' && node.binding == null) {
			node = node.set('binding', scopes.resolve(node));
			log.debug(`= ${node.debugString()}`);
		}

		return node;
	});
	return [exprs, scopes];
};

module.exports = Block;

