
const { Map, Record } = require('immutable');
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
	return this;
};

module.exports = Comment;

