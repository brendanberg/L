/*
	Collection Lookup AST node
*/

const { Map, List, Record } = require('immutable');

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

    if (target._name === 'Record' && this.term._name === 'Identifier') {
        if (!(target.ctx.has(this.term.label))) {
            let name = this.target.label;
            let label = this.term.label;
			throw new error.NameError(`'${name}' has no attribute '${label}'`);
        }

        let value = target.ctx.get(this.term.label);
        return value.setIn(['tags', 'type'], target.getIn(['tags', 'type'], ''));
    } else if (this.term._name === 'Identifier' || this.term._name === 'Option') {
		if (!(this.term.label in this.target.values)) {
            let name = this.target.tags['name'];
            let label = this.term.label;
			throw new error.NameError(`'${name}' has no attribute '${label}'`);
		}
		//let value = target.values[this.term.label]; //.eval(ctx);
		//return value.setIn(['tags', 'type'], target.tags.label || '');
	}
};

module.exports = Lookup;

