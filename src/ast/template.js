/*
   Template AST node
 */

let I = require('immutable');

const _ = null;
const _map = I.Map({});
const _list = I.List([]);


let Template = I.Record({match: _, tags: _map}, 'Template');

Template.prototype.toString = function() {
	return this.match.toString();
};

Template.prototype.repr = function(depth, style) {
	return this.match.repr(depth, style);
};

Template.prototype.eval = function(ctx) {
	return this;
};

Template.prototype.transform = function(func) {
    return func(this);
};

module.exports = Template;

