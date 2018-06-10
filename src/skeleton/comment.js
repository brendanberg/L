
const { Map, Record } = require('immutable');
const { NotImplemented } = require('../error');
const _ = null;
const _map = Map({});

const AST = require('../ast');


Comment = Record({text: _, tags: _map}, 'Comment');

Comment.prototype.toString = function () {
	return this.text;
};

Comment.prototype.repr = function (depth, fmt) {
	return this.toString();
};

Comment.prototype.transform = function(context, match) {
	throw new NotImplemented('Cannot call transform on a skeleton node other than block');
};

module.exports = Comment;

