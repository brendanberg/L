
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
	let exprs = [];
	let type;

	for (let expr of this.exprs) {
		let exp = match.messageItem(context, expr.terms.first(), expr.terms.rest());
		if (exp) { exprs.push(exp); }
	}

	//return new 
	//	if (x && type && type === x._name

	return null;
};

module.exports = Message;

