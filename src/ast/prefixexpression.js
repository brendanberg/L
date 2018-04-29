/*
   PrefixExpression AST node
 */

const { Map, List, Record } = require('immutable');
const KeyValuePair = require('./keyvaluepair');
const Invocation = require('./invocation');

const _ = null;
const _map = Map({});
const _list = List([]);


let PrefixExpression = Record({op: _, expr: _, tags: _map}, 'PrefixExpression');

PrefixExpression.prototype.toString = function() {
    return this.op.replace(/^'(.*)'$/, '$1') + this.exp.toString();
};

PrefixExpression.prototype.repr = function(depth, style) {
    return style.operator(this.op.replace(/^'(.*)'$/, '$1')) + this.exp.repr(depth, style);
};

PrefixExpression.prototype.eval = function(ctx) {
    // TODO: Replace the list / invocation with a message / message send
    return (new Invocation({target: this.expr, plist: List([this.op])})).eval(ctx);
};

PrefixExpression.prototype.transform = function(func) {
    let transform = function(node) {
        return (node && 'transform' in node) ? node.transform(func) : func(node);
    };

    return func(this.update('expr', transform));
};

module.exports = PrefixExpression;

