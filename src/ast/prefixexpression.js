/*
   PrefixExpression AST node
 */

const { Map, List, Record } = require('immutable');
const KeyValuePair = require('./keyvaluepair');
const Call = require('./call');

const _ = null;
const _map = Map({});
const _list = List([]);


let PrefixExpression = Record({op: _, expr: _, scope: _, tags: _map}, 'PrefixExpression');

PrefixExpression.prototype.toString = function() {
    return this.op.label.replace(/^'(.*)'$/, '$1') + this.expr.toString();
};

PrefixExpression.prototype.repr = function(depth, style) {
    return style.operator(this.op.label.replace(/^'(.*)'$/, '$1')) + this.expr.repr(depth, style);
};

PrefixExpression.prototype.eval = function(ctx) {
    // TODO: Replace the list / invocation with a message / message send
    return (new Call({
		target: this.expr, args: List([this.op]),
		selector: "('" + this.op.label + "')",
		scope: this.scope
	})).eval(ctx);
};

PrefixExpression.prototype.transform = function(func) {
    let transform = function(node) {
        return (node && 'transform' in node) ? node.transform(func) : func(node);
    };

    return func(this.update('expr', transform));
};

module.exports = PrefixExpression;

