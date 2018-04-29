/*
   Map AST Node
*/

const { Map: IMap, List, Record } = require('immutable');
const Context = require('../context');
const _ = null;
const _list = List([]);
const _map = IMap({});

const Map = Record({items: _list, ctx: _, tags: _map}, 'Map');

Map.prototype.toString = function() {
	let delims = ['[',']']; //this.getIn(['tags', 'source'], 'list')];

    if (this.items.count() == 0) {
        return delims[0] + ':' + delims[1];
    } else {
        return (
            delims[0] + 
            this.items.map(function(x) { return x.toString(); }).join(', ') +
            delims[1]
        );
    }
};

Map.prototype.repr = function(depth, style) {
    let delims = ['[',']'];

    if (this.items.count() == 0) {
        return style.delimiter(delims[0]) + ':' + style.delimiter(delims[1]);
    } else {
        return (
            style.delimiter(delims[0]) +
            this.items.map(function(x) { return x.repr(depth, style); }).join(
                style.delimiter(', ')) +
            style.delimiter(delims[1])
        );
    }
};

Map.prototype.eval = function(ctx) {
	let newContext = {};

	return this.update('items', function(items) {
		//TODO: is there a more straightforward way to update each item?
		return items.map(function(kvp) {
			let newKeyVal = kvp.eval(ctx);
			newContext[newKeyVal.key] = newKeyVal.val;
			return newKeyVal;
		});
	}).update('ctx', function(ctx) {
		if (ctx) {
		    ctx.local.merge(newContext);
		} else {
			ctx = new Context({local: IMap(newContext)});
		}
		return ctx;
	});
};

Map.prototype.transform = function(func) {
    let transform = function(node) {
        return ('transform' in node) ? node.transform(func) : func(node);
    };

    return func(this.update('items', function(list) {
        return list.map(transform);
    }));
};

module.exports = Map;

