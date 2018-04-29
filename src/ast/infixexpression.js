/*
   Infix Expression AST node
 */

const { Map, List, Record } = require('immutable');
const KeyValuePair = require('./keyvaluepair');
const Invocation = require('./invocation');
const _ = null;
const _map = Map({});
const _list = List([]);


let InfixExpression = Record({op: _, lhs: _, rhs: _, tags: _map}, 'InfixExpression');

InfixExpression.prototype.toString = function() {
    return [
        this.lhs.toString(), 
        this.op.label.replace(/^'(.*)'$/, '$1'),
        this.rhs.toString()
    ].join(' ');
};

InfixExpression.prototype.repr = function(depth, style) {
    return [
        this.lhs.repr(depth, style),
        style.operator(this.op.label.replace(/^'(.*)'$/, '$1')),
        this.rhs.repr(depth, style)
    ].join(' ');
};

InfixExpression.prototype.eval = function(ctx) {
    // TODO: Replace the list / invocation with a message / message send
    let selector = List([new KeyValuePair({key: this.op, val: this.rhs})]); 
    return (new Invocation({target: this.lhs, plist: selector})).eval(ctx);
};

InfixExpression.prototype.transform = function(func) {
    let transform = function(node) {
        return (node && 'transform' in node) ? node.transform(func) : func(node);
    };

    return func(this.update('lhs', transform).update('rhs', transform));
};

module.exports = InfixExpression;

