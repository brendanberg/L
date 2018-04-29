
const { Map, List, Record } = require('immutable');
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

Expression.prototype.transform = function(context, match) {
	let ast = match.expression(context, this.terms.first(), this.terms.rest());

	// TODO: Reject the transform if not all terms are consumed
	// NOTE: Probably best to add the Error node in the match fn
	//       rather than the Skeleton transform.
	return ast && ast[0];
};

module.exports = Expression;

