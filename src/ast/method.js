/*
   Method AST node
 */

const { Map, List, Record } = require('immutable');

const _ = null;
const _map = Map({});
const _list = List([]);


let Method = Record({type: _, target: _, selector: _list, block: _, ctx: _, tags: _map}, 'Method');

/*
Method.prototype.toString = function() {
    let arrow = ({fat: ' => ', thin: ' -> '})[this.tags['type'] || 'thin'];

    return (
        '(' + this.teplate.match.items.map(stringify).join(', ') + ')' +
        arrow + this.block.toString()
    );
};

Method.prototype.repr = function(depth, style) {
	let arrow = ({fat: ' => ', thin: ' -> '})[this.tags['type'] || 'thin'];

	return (
		style.delimiter('(') +
		this.template.match.items.map(stringify).join(style.separator(', ')) + 
		style.delimiter(')') + style.delimiter(arrow) + this.block.repr(depth, style)
    );
}*/

Method.prototype.eval = function(ctx) {
		// This is kind of a weird one because methods are declarative and
		// operate on a type defined in the package context. Importing the
		// type will also import its context I guess

		// 1. Find the type identifier in the current context. 
		//    (if it doesn't exist, create it.)
		// 2. Update the type's context with the method's selector
		//    and body.

		var typeId = this.typeId.eval(ctx);
		var selector = '(' + this.plist.list.map(function(x) {
			return x[0].name + (x[1] ? ':' : '')
		}).join('') + ')';

		var type = ctx.lookup(typeId.name);

		if (type && type.has('ctx')) {
			type = type.update('ctx', function(ctx) {
				ctx.local[selector] = this;
				return ctx;
			});
		}
		// self = self.update('block', function(block) {
		// 	return block.eval(ctx);
		// });
		
		//return this;
};
/*
Method.prototype.transform = function(func) {
    let transform = function(node) {
        return (node && 'transform' in node) ? node.transform(func) : func(node);
    };

    return func(this.update('plist', transform).update('block', transform));
};
*/
module.exports = Method;

