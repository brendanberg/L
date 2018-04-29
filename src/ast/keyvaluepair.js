/*
    Key value pair AST node
 */

const { Map, Record } = require('immutable');
const _ = null;
const _map = Map({});


const KeyValuePair = Record({key: _, val:_, tags: _map}, 'KeyValuePair');

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
	return this.merge({key: this.key.eval(ctx), val: this.val.eval(ctx)});
};

KeyValuePair.prototype.transform = function(func) {
    return func(this);
}

module.exports = KeyValuePair;
