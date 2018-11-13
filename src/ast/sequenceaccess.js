/*
	Collection SequenceAccess AST node
*/

const { Map, List, Record } = require('immutable');
const Bottom = require('./bottom');
const _List = require('./list');
const _ = null;
const _map = Map({});
const _list = List([]);

const SequenceAccess = Record({target: _, terms: _list, scope: _, tags: _map}, 'SequenceAccess');

SequenceAccess.prototype.toString = function() {
	return (
		this.target.toString() + '[' + 
		this.terms.map(function(t) {
			return t.toString();
		}).toArray().join(', ') + ']'
	);
};

SequenceAccess.prototype.repr = function(depth, style) {
	return (
		this.target.repr(depth, fmt) +
		style.delimiter('[') +
		this.terms.map(function(t) {
			return t.repr(depth, fmt);
		}).toArray().join(style.separator(', ')) +
		style.delimiter(']')
	);
};

SequenceAccess.prototype.eval = function(ctx) {
	var target = this.target.eval(ctx);
	var result = [];
	var list, index;

	// Lookup integer indexes in lists or identifiers in dictionaries
	for (let item of this.terms) {
		index = item.eval(ctx);
		if (target._name === 'List') {
			if (index._name !== 'Integer') {
				return new Bottom({scope: this.scope});
			}
			if (index.value < 0) {
				result.push(
					target.items.get(target.items.size + index.value) ||
					new Bottom({scope: this.scope})
				);
			} else {
				result.push(target.items.get(index.value)
					|| new Bottom({scope: this.scope}));
			}
		} else if (target._name === 'Map') {
			//TODO: Test that index is hashable
			result.push(target.ctx.lookup(index));
		} else if (target._name === 'Text') {
			if (index._name !== 'Integer') {
				// TODO: THis is an error
			}

			if (index.value < 0) {
				index.value = target.value.length + index.value;
			}

			// TODO: Is it an error to access an out-of-bounds character?
			// It would make some sort of sense if we were building a List
			// instead of Text and the out-of-bounds value would be _.
			result.push(target.value.get(index.value, ''));
		}
	}

	if (target._name === 'Text') {
		return target.set('value', List(result));
	} else {
		return new _List({items: result, scope: this.scope});
	}
};

module.exports = SequenceAccess;

