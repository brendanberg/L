/*
   Map AST Node
*/

const { Map, List, Record } = require('immutable');
const Context = require('../context');
const _ = null;
const _list = List([]);
const _map = Map({});

const Map_ = Record({items: _list, scope: _, tags: _map}, 'Map');

Map_.prototype.toString = function() {
	let delims = ['[',']']; //this.getIn(['tags', 'source'], 'list')];

    if (this.items.count() == 0) {
        return delims[0] + ':' + delims[1];
    } else {
		let items = this.items;
        return (
            delims[0] + 
            items.map((kvpair) => {
				//console.log(kvpair.toJSON());
				return kvpair.key.toString() + ': ' + kvpair.val.toString();
			}).join(', ') +
            delims[1]
        );
    }
};

Map_.prototype.repr = function(depth, style) {
    let delims = ['[',']'];

    if (this.items.count() == 0) {
        return style.delimiter(delims[0]) + ':' + style.delimiter(delims[1]);
    } else {
		let items = this.items;

        return (
            style.delimiter(delims[0]) +
            items.map(function(kvpair) {
				return (
					kvpair.key.repr(depth, style) + style.delimiter(': ') +
					kvpair.val.repr(depth, style)
				);
			}).join(style.delimiter(', ')) + style.delimiter(delims[1])
        );
    }
};

Map_.prototype.eval = function(ctx) {
	let mapItems = this.update('items', (items) => {
		return List(items.reduce((map, item) => {
			return map.set(item.key, item.eval(ctx)[0]);
		}, Map({})).valueSeq());
	});

	return [mapItems, ctx];
};

Map_.prototype.transform = function(func) {
    let transform = function(node) {
        return ('transform' in node) ? node.transform(func) : func(node);
    };

    return func(this.update('items', function(list) {
        return list.map(transform);
    }));
};

module.exports = Map_;

