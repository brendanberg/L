/*
   Bottom AST node
 */

let I = require('immutable');

const _ = null;
const _map = I.Map({});
const _list = I.List([]);


let Bottom = I.Record({scope: _, tags: _map}, 'Bottom');

Bottom.prototype.toString = function() {
    return '_';
};

Bottom.prototype.repr = function(depth, style) {
    return style.boolean('_');
};

Bottom.prototype.eval = function(ctx) {
    return [this, ctx];
};

Bottom.prototype.transform = function(func) {
    return func(this);
};

module.exports = Bottom;
