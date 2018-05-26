/*
    Immediate AST node
    (Really an IR node)
 */

const { Map, List, Record } = require('immutable');
const Bottom = require('./bottom');

const _ = null;
const _map = Map({});
const _list = List([]);


let Immediate = Record({target: _, tags: _map}, 'Immediate');

Immediate.prototype.toString = function() {
	return '\\' + this.target.toString();
};

Immediate.prototype.repr = function(depth, style) {
	return style.operator('\\') + this.target.repr(depth, style);
};

Immediate.prototype.eval = function(ctx) {
    let target = this.target.eval(ctx);

    if (target._name === 'Block') {
		return target.exprs.reduce((result, exp) => {
			return result.push((exp.eval && exp.eval(ctx)) || new Bottom());
		}, List([])).last();
    } else {
        return target;
    }
};

module.exports = Immediate;

