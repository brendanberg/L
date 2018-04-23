/*
    Invocation AST node
 */

let I = require('immutable');

const _ = null;
const _map = I.Map({});
const _list = I.List([]);


let Invocation = I.Record({target: _, plist: _list, tags: _map}, 'Invocation');

Invocation.prototype.toString = function () {
    return this.target.toString() + '(' + this.plist.map(function(it) {
        return it.toString();
    }).toArray().join(', ') + ')';
};

Invocation.prototype.repr = function(depth, style) {
    return this.target.repr(depth, style) + style.delimiter('(') +
        this.plist.map(function(it) {
            return it.repr(depth, style);
        }).toArray().join(style.delimiter(', ')) + style.delimiter(')');
};

Invocation.prototype.eval = function(ctx) {
    return this;
}

module.exports = Invocation;
