/*
   Infix Expression AST node
 */

const { Map, List, Record } = require('immutable');
const KeyValuePair = require('./keyvaluepair');
const Call = require('./call');
const _ = null;
const _map = Map({});
const _list = List([]);


let InfixExpression = Record({op: _, lhs: _, rhs: _, scope: _, tags: _map}, 'InfixExpression');

InfixExpression.prototype.toString = function() {
	let grouped = this.getIn(['tags', 'parenthesized'], false);
	let open = grouped ? '(' : '';
	let close = grouped ? ')' : '';
    return [
        open + this.lhs.toString(), 
        this.op.label.replace(/^'(.*)'$/, '$1'),
        this.rhs.toString() + close
    ].join(' ');
};

InfixExpression.prototype.repr = function(depth, style) {
	let grouped = this.getIn(['tags', 'parenthesized'], false);
	let open = grouped ? '(' : '';
	let close = grouped ? ')' : '';
    return [
        style.delimiter(open) + this.lhs.repr(depth, style),
        style.operator(this.op.label.replace(/^'(.*)'$/, '$1')),
        this.rhs.repr(depth, style) + style.delimiter(close)
    ].join(' ');
};

InfixExpression.prototype.eval = function(ctx) {
    // TODO: Replace the list / invocation with a message / message send
    let args = List([new KeyValuePair({
			key: this.op,
			val: this.rhs,
			scope: this.scope
		})]); 

    return (new Call({
		target: this.lhs, args: args,
		selector: "('" + this.op.label + "':)",
		scope: this.scope
	})).eval(ctx);
};

InfixExpression.prototype.transform = function(func) {
    let transform = function(node) {
        return (node && 'transform' in node) ? node.transform(func) : func(node);
    };

    return func(this.update('op', transform)
		.update('lhs', transform)
		.update('rhs', transform)
	);
};

module.exports = InfixExpression;

