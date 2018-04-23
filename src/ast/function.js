/*
   Function AST node
 */

let I = require('immutable');

const _ = null;
const _map = I.Map({});
const _list = I.List([]);


let _Function = I.Record({template: _, plist: _list, block: _, ctx: _, tags: _map}, 'Function');

_Function.prototype.toString = function() {
    let arrow = ({fat: ' => ', thin: ' -> '})[this.tags['type'] || 'thin'];

    return (
        '(' + this.teplate.match.items.map(function(node) {
			return node.toString();
		}).join(', ') + ')' +
        arrow + this.block.toString()
    );
};

_Function.prototype.repr = function(depth, style) {
	let arrow = ({fat: ' => ', thin: ' -> '})[this.tags['type'] || 'thin'];

	return (
		style.delimiter('(') +
		this.template.match.items.map(function(node) {
			return node.toString();
		}).join(style.delimiter(', ')) + 
		style.delimiter(')') + style.delimiter(arrow) + this.block.repr(depth, style)
    );
}

_Function.prototype.eval = function(ctx) {
    let val = this.transform(function(node) {
        return node._name === 'Evaluate' ? node.eval(ctx) : node;
    }).set('ctx', ctx);
    return val;
};

_Function.prototype.transform = function(func) {
    let transform = function(node) {
        return (node && 'transform' in node) ? node.transform(func) : func(node);
    };

    return func(this.update('plist', transform).update('block', transform));
};

module.exports = _Function;

