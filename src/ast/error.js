/*
	AST Error node
*/

const { List, Map, Record } = require('immutable');
const _ = null;
const _list = List([]);
const _map = Map({});
const { ParseError } = require('../error');

const Error = Record({subject: _, message: _, consumed: _, encountered: _list}, 'Error');

Error.prototype.toString = function() {
	let consumed = this.consumed ? this.consumed.toString() + ' ' : '';
	return (
		consumed +
		this.encountered.map(function(it) {
			return it.toString();
		}).join(' ')
	);
};

Error.prototype.repr = function(depth, style) {
	// Use the Skel repr funcs to print the error tokens.
	let consumed = this.consumed ? this.consumed.repr(depth, style) + ' ' : '';
	return (
		consumed + 
		style.important(
			style.error(this.encountered.map(function(it) {
				return it.toString();
			}).join(' '))
		)
	);
};

Error.prototype.eval = function(ctx) {
	throw new ParseError(this.message);
};

module.exports = Error;

