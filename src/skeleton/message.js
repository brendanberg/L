
const { Map, List, Record } = require('immutable');
const { NotImplemented } = require('../error');
const _ = null;
const _map = Map({});
const _list = List([]);


Message = Record({exprs: _list, tags: _map}, 'Message');

Message.prototype.toString = function() {
	return '(' + this.exprs.map(function(x) {
		return x.toString();
	}).toArray().join(', ') + ')';
};

Message.prototype.repr = function(depth, style) {
	return this.toString();
};

Message.prototype.transform = function(context, match) {
	throw new NotImplemented('Cannot call transform on a skeleton node other than block');
};

module.exports = Message;

