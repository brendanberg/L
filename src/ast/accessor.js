/*
	Collection Accessor AST node
*/

const { Map, List: IList, Record } = require('immutable');
const Bottom = require('./bottom');
const List = require('./list');
const _ = null;
const _map = Map({});
const _list = IList([]);

const Accessor = Record({target: _, terms: _list, tags: _map}, 'Accessor');

Accessor.prototype.toString = function() {
	return (
		this.target.toString() + '[' + 
		this.terms.map(function(t) {
			return t.toString();
		}).toArray().join(', ') + ']'
	);
};

Accessor.prototype.repr = function(depth, style) {
	return (
		this.target.repr(depth, fmt) +
		style.delimiter('[') +
		this.terms.map(function(t) {
			return t.repr(depth, fmt);
		}).toArray().join(style.separator(', ')) +
		style.delimiter(']')
	);
};

Accessor.prototype.eval = function(ctx) {
	var target = this.target.eval(ctx);
	var result = [];
	var list, index;

	// Lookup integer indexes in lists or identifiers in dictionaries
	for (let item of this.terms) {
		index = item.eval(ctx);
		if (target._name === 'List') {
			if (index._name !== 'Integer') {
				return new Bottom();
			}
			if (index.value < 0) {
				result.push(
					target.items.get(target.items.size + index.value) ||
					new Bottom()
				);
			} else {
				result.push(target.items.get(index.value) || new Bottom());
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

			// This is a problem.. Pushing empty string? LOL
			// TODO: Should the default be Bottom()?
			result.push(target.value[index.value] || '');
		}
	}

	if (target.type === 'Text') {
		return target.set('value', result.join(''));
	} else {
		return new List({items: result});
	}
};

module.exports = Accessor;

