/*
   Grouping AST node
 */

let I = require('immutable');

const _ = null;
const _map = I.Map({});
const _list = I.List([]);


let Grouping = I.Record({expr: _}, 'Grouping');

Grouping.prototype.toString = function() {
    return '(' + this.expr.toString() + ')';
};

Grouping.prototype.repr = function(depth, style) {
    return (
        style.delimiter('(') +
        this.expr.repr(depth, style) +
        style.delimiter(')')
    );
};

Grouping.prototype.eval = function(ctx) {
    return this.expr.eval(ctx);
};

Grouping.prototype.transform = function() {};

module.exports = Grouping;

