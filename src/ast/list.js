/*
   List AST Node
*/

const { Map, List: IList, Record } = require('immutable');
const _ = null;
const _list = IList([]);
const _map = Map({});


let List = Record({items: _list, tags: _map}, 'List');

List.prototype.toString = function() {
	let delims = ['[',']']; //this.getIn(['tags', 'source'], 'list')];
	return delims[0] + this.items.map(function(node) {
		return node.toString();
	}).join(', ') + delims[1];
};

List.prototype.repr = function(depth, style) {
    let delims = ['[',']'];
    return (
        style.delimiter(delims[0]) +
        this.items.map(function(node) {
			return node.repr(depth, style);
		}).join(style.delimiter(', ')) +
        style.delimiter(delims[1])
    );
};

List.prototype.eval = function(ctx) {
    return this.update('items', function(list) {
        return list.map(function(it) { return it.eval(ctx) });
    });
};

List.prototype.transform = function(func) {
    return func(this.update('items', function(list) {
        return list.map(function(x) {
			return (x && 'transform' in x) ? x.transform(func) : func(x);
		});
    }));
};

module.exports = List;

