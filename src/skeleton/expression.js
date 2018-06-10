
const { Map, List, Record } = require('immutable');
const { NotImplemented } = require('../error');
const _ = null;
const _map = Map({});
const _list = List([]);

const AST = require('../ast');


Expression = Record({terms: _list, tags: _map}, 'Expression');

Expression.prototype.toString = function () {
	if (this.getIn(['tags', 'enclosure'], null) === 'parentheses') {
		return '(' + this.terms.map(function(t) { return t.toString() }).join(' ') + ')';
	} else {
		return this.terms.map(function(t) { return t.toString() }).join(' ');
	}
};

Expression.prototype.repr = function (depth, fmt) {
	return this.toString();
};

Expression.prototype.transform = function(scopes, match) {
	throw new NotImplemented('Cannot call transform on a skeleton node other than block');
};

module.exports = Expression;

