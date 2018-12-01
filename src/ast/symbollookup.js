/*
	Collection SymbolLookup AST node
*/

const { Map, List, Record } = require('immutable');
const { NameError } = require('../error');
const _ = null;
const _map = Map({});

const SymbolLookup = Record({target: _, term: _, tags: _map}, 'SymbolLookup');

SymbolLookup.prototype.toString = function() {
	return this.target.toString() + this.term.toString();
};

SymbolLookup.prototype.repr = function(depth, style) {
	return (
		this.target.repr(depth, style) +
		this.term.repr(depth, style)
	);
};

SymbolLookup.prototype.eval = function(ctx) {
    let [target, _] = this.target.eval(ctx);

    if (target._name === 'Record' && this.term._name === 'Symbol') {
        if (!(target.fields.has(this.term.label))) {
            let name = this.target.label;
            let label = this.term.label;
			throw new NameError(`'${name}' has no attribute '${label}'`);
        }

        return [target.fields.get(this.term.label), ctx];
    } else if (target._name === 'UnionType' && this.term._name === 'Symbol') {
		if (!(target.variants.has(this.term.label))) {
            let name = this.target.label;
            let label = this.term.label;
			throw new NameError(`'${name}' has no attribute '${label}'`);
		}

		let retval = target.variants.get(this.term.label)
			.setIn(['tags', 'type'], target.label)
			.setIn(['tags', 'typebinding'], target.binding);

		return [retval, ctx];
	}
};

SymbolLookup.prototype.transform = function(func) {
	let transform = (node) => { return (node && 'transform' in node) ? node.transform(func) : func(node); };

	return (this.update('target', transform)
		.update('term', transform)
	);
};

module.exports = SymbolLookup;

