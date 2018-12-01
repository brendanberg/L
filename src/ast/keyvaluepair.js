/*
    Key value pair AST node
 */

const { Map, Record } = require('immutable');
const _ = null;
const _map = Map({});


const KeyValuePair = Record({key: _, val: _, scope: _, tags: _map}, 'KeyValuePair');

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
	return [this.merge({key: this.key.eval(ctx)[0], val: this.val.eval(ctx)[0]}), ctx];
};

KeyValuePair.prototype.transform = function(func) {
	let transform = (node) => {
		return node && ('transform' in node) ? node.transform(func) : func(node);
	};

    return func(this.update('key', transform).update('val', transform));
}

module.exports = KeyValuePair;
