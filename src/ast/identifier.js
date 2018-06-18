/*
   Identifier AST node
 */

const { Map, List, Set, Record } = require('immutable');
const { NameError } = require('../error');
const _ = null;
const _map = Map({});
const _list = List([]);
const _set = Set([]);


let Identifier = Record({label: _, modifier: _, binding: _, scope: _, tags: _map}, 'Identifier');

Identifier.prototype.toString = function() {
	let type = this.getIn(['tags', 'type'], '');
	let collect = this.getIn(['tags', 'collect'], false) ? '...' : '';
	let modifier = this.get('modifier') || '';
	return (type && type + ' ') + this.label + modifier + collect;
};

Identifier.prototype.repr = function(depth, style) {
    return style.name(this.toString());
};

Identifier.prototype.eval = function(ctx) {
	// TODO: If there's no binding at eval time, that's An Error (TM).
	var value = ctx.get(this.binding);

	if (value === null || value === undefined) {
		var msg = `${this.label} is not defined in the current scope`;
		throw new NameError(msg);
	}

	return value.setIn(['tags', 'name'], this.label);
};

Identifier.prototype.debugString = function () {
	let sc = this.scope.map((sym)=>{return sym.toString();}).toArray().join(',');
	let local = this.getIn(['tags', 'local']) ? 'local ' : '';
	let binding = this.binding ? this.binding.toString() : '--';

	return `${local}{${this.label}}[${sc}]: ${binding}`;
};

module.exports = Identifier;

