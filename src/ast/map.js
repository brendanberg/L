/*
   Map AST Node
*/

const { Map: IMap, List, Record } = require('immutable');
const Context = require('../context');
const _ = null;
const _list = List([]);
const _map = IMap({});

// TODO: Remove ctx field
const Map = Record({items: _map, ctx: _, tags: _map}, 'Map');

Map.prototype.toString = function() {
	let delims = ['[',']']; //this.getIn(['tags', 'source'], 'list')];

    if (this.items.count() == 0) {
        return delims[0] + ':' + delims[1];
    } else {
		let items = this.items;
        return (
            delims[0] + 
            items.keySeq().map(function(key) {
				return items.get(key).key.toString() + ': ' + items.get(key).val.toString();
			}).join(', ') +
            delims[1]
        );
    }
};

Map.prototype.repr = function(depth, style) {
    let delims = ['[',']'];

    if (this.items.count() == 0) {
        return style.delimiter(delims[0]) + ':' + style.delimiter(delims[1]);
    } else {
		let items = this.items;
        return (
            style.delimiter(delims[0]) +
            items.keySeq().map(function(key) {
				return (
					items.get(key).key.repr(depth, style) + style.delimiter(': ') +
					items.get(key).val.repr(depth, style)
				);
			}).join(style.delimiter(', ')) + style.delimiter(delims[1])
        );
    }
};

Map.prototype.eval = function(ctx) {
	return this;
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

