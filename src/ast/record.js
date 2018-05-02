
const { Map, List, Record: IRecord } = require('immutable');
const _ = null;
const _map = Map({});
const _list = List([]);


Record = IRecord({label: _, members: _list, ctx: _, tags: _map}, 'Record');

Record.prototype.toString = function () {
	let members = this.members.map(function(node) {
		return node.toString();
	});
	return this.label + ' << ' + members.join(', ') + ' >>';
};

Record.prototype.repr = function (depth, style) {
	let members = this.members.map(function(node) {
		return node.repr(depth, style);
	});

	return (
		style.name(this.label) + 
		style.delimiter(' << ') +
		members.join(style.delimiter(', ')) +
		style.delimiter(' >>')
	);
};

Record.prototype.eval = function(ctx) {
	var signature = '(' + this.members.map(function(x) {
		return x.label + ':'
	}).join('') + ')';

	// This is the constructor function that returns a value created
	// with the struct's parameters. It's bound to the struct's ctx.
    /*
	this.ctx.local = this.ctx.local.set(signature, function() {
		var args = Array.prototype.slice.call(arguments);
		var values = {};
		this.members.forEach(function(member, idx) {
			values[member.key] = args[idx];
		});
		return new AST.Value({
			mommy: this, values: values, ctx: new Context(this.ctx)
		});
	});
    */
	return this;
};

Record.prototype.transform = function(context, match) {
	// Note: This rule should be unreachable if the grammar rules are correct
	return this;
};

module.exports = Record;

