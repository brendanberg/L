/*
   PrefixExpression AST node
 */

let I = require('immutable');
let KeyValuePair = require('./keyvaluepair');
let Invocation = require('./invocation');

const _ = null;
const _map = I.Map({});
const _list = I.List([]);


let PrefixExpression = I.Record({op: _, expr: _, tags: _map}, 'PrefixExpression');

PrefixExpression.prototype.toString = function() {
    return this.op.replace(/^'(.*)'$/, '$1') + this.exp.toString();
};

PrefixExpression.prototype.repr = function(depth, style) {
    return style.operator(this.op.replace(/^'(.*)'$/, '$1')) + this.exp.repr(depth, style);
};

PrefixExpression.prototype.eval = function(ctx) {
    let target = this.expr.eval(ctx);
    let selector = I.List([new KeyValuePair({key: `'{this.op}'`, val: _})]);

    // TODO: Replace the list / invocation with a message / message send
    return (new Invocation({target: target, plist: selector})).eval(ctx);
};

PrefixExpression.prototype.transform = function(func) {
    let transform = function(node) {
        return (node && 'transform' in node) ? node.transform(func) : func(node);
    };

    return func(this.update('expr', transform));
};

module.exports = PrefixExpression;

