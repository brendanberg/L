/*
    Key value pair AST node
 */

let I = require('immutable');

const _ = null;
const _map = I.Map({});
const _list = I.List([]);


let KeyValuePair = I.Record({key: _, val:_, tags: _map}, 'KeyValuePair');

KeyValuePair.prototype.toString = function() {
    return this.key.toString() + ': ' + this.val.toString();
};

KeyValuePair.prototype.repr = function(depth, style) {
    return (
        this.key.repr(depth, style) + style.delimiter(': ') +
        this.val.repr(depth, style)
    )
};

KeyValuePair.prototype.eval = function(ctx) {
    // TODO: Figure out whether this is right
    ctx.local = ctx.local.set(this.key.eval(ctx), this.val.eval(ctx));
    return this;
};

KeyValuePair.prototype.transform = function(func) {
    return func(this);
}

module.exports = KeyValuePair;
