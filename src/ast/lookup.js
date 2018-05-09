/*
	Collection Lookup AST node
*/

const { Map, List, Record } = require('immutable');
const { NameError } = require('../error');
const _ = null;
const _map = Map({});

const Lookup = Record({target: _, term: _, tags: _map}, 'Lookup');

Lookup.prototype.toString = function() {
	return this.target.toString() + '.' + this.term.toString();
};

Lookup.prototype.repr = function(depth, style) {
	return (
		this.target.repr(depth, fmt) +
		style.operator('.') +
		this.term.repr(depth, fmt)
	);
};

Lookup.prototype.eval = function(ctx) {
    let target = this.target.eval(ctx);

    if (target._name === 'Value' && this.term._name === 'Qualifier') {
        if (!(target.fields.has(this.term.label))) {
            let name = this.target.label;
            let label = this.term.label;
			throw new NameError(`'${name}' has no attribute '${label}'`);
        }

        return target.fields.get(this.term.label);
    } else if (target._name === 'Union' && this.term._name === 'Qualifier') {
		if (!(target.variants.has(this.term.label))) {
            let name = this.target.label;
            let label = this.term.label;
			throw new NameError(`'${name}' has no attribute '${label}'`);
		}

		return target.variants.get(this.term.label).setIn(['tags', 'type'], target.label);
	}
};

module.exports = Lookup;

