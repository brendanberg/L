/*
   List AST Node
*/

const { Map, List, Record } = require('immutable');
const _ = null;
const _list = List([]);
const _map = Map({});


let List_ = Record({items: _list, scope: _, tags: _map}, 'List');

List_.prototype.toString = function() {
	let delims = ['[',']']; //this.getIn(['tags', 'source'], 'list')];
	return delims[0] + this.items.map(function(node) {
		return node ? node.toString() : '';
	}).join(', ') + delims[1];
};

List_.prototype.repr = function(depth, style) {
    let delims = ['[',']'];
    return (
        style.delimiter(delims[0]) +
        this.items.map(function(node) {
			return node.repr(depth, style);
		}).join(style.delimiter(', ')) +
        style.delimiter(delims[1])
    );
};

List_.prototype.eval = function(ctx) {
    return this.update('items', (list) => {
        return list.map((it) => { return it.eval(ctx) });
    });
};

List_.prototype.transform = function(func) {
    return func(this.update('items', function(items) {
        return items.map(function(item) {
			return item && ('transform' in item) ? item.transform(func) : func(item);
		});
    }));
};

module.exports = List_;

