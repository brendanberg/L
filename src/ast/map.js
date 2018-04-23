/*
   Map AST Node
*/

const { Map, List, Record } = require('immutable');

const _ = null;
const _list = List([]);
const _map = Map({});


let _Map = Record({items: _list, ctx: _, tags: _map}, 'Map');

_Map.prototype.toString = function() {
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

_Map.prototype.repr = function(depth, style) {
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

_Map.prototype.eval = function(ctx) {
	var newContext = {};

	return this.update('items', function(items) {
		//TODO: is there a more straightforward way to update each item?
		return items.map(function(kvp) {
			return kvp.update('val', function(value) {
				newContext[kvp.key] = value;
				return value.eval(ctx);
			});
		});
	}).update('ctx', function(ctx) {
	    ctx.local.merge(newContext);
		return ctx;
	});
};

_Map.prototype.transform = function(func) {
    let transform = function(node) {
        return ('transform' in node) ? node.transform(func) : func(node);
    };

    return func(this.update('items', function(list) {
        return list.map(transform);
    }));
};

module.exports = _Map;

