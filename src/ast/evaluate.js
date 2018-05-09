/*
    Evaluate AST node
    (Really an IR node)
 */

const { Map, List, Record } = require('immutable');
const Bottom = require('./bottom');

const _ = null;
const _map = Map({});
const _list = List([]);


let Evaluate = Record({target: _, tags: _map}, 'Evaluate');

Evaluate.prototype.toString = function() {
	return '\\' + this.target.toString();
};

Evaluate.prototype.repr = function(depth, style) {
	return style.operator('\\') + this.target.repr(depth, style);
};

Evaluate.prototype.eval = function(ctx) {
    let target = this.target.eval(ctx);

    if (target._name === 'Block') {
		return target.exprs.reduce(function(result, exp) {
			return result.push((exp.eval && exp.eval(ctx)) || new Bottom());
		}, List([])).last();
    } else {
        return target;
    }
};

module.exports = Evaluate;

