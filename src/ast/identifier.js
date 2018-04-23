/*
   Identifier AST node
 */

const { Map, List, Record } = require('immutable');
const { NameError } = require('../error');
const _ = null;
const _map = Map({});
const _list = List([]);


let Identifier = Record({label: _, modifier: _, tags: _map}, 'Identifier');

Identifier.prototype.toString = function() {
	let type = this.getIn(['tags', 'type'], '');
	return (type && type + ' ') + this.label + (this.modifier || '');
};

Identifier.prototype.repr = function(depth, style) {
    return style.name(this.toString());
};

Identifier.prototype.eval = function(ctx) {
	var value = ctx.lookup(this.label);

	if (value === null || value === undefined) {
		var msg = (
			"the current module has no attribute '" +
			this.label + "'"
		);
		throw new NameError(msg);
	}

	return value.setIn(['tags', 'name'], this.label);
};

module.exports = Identifier;

