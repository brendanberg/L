
const { Map, List, Record } = require('immutable');
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
	/*
	let exprs = this.exprs.reduce(function(result, expr) {
		let exp = match.messageItem(context, expr.terms.first(), expr.terms.rest());
		return exp ? result.push(exp) : result;
	}, List([]));
	*/
	return null;
};

module.exports = Message;

