
const { Map, List, IRecord: Record } = require('immutable');
const _ = null;
const _map = Map({});
const _list = List([]);


Record = IRecord({members: _list, ctx: _, tags: _map}, 'Record');

Record.prototype.toString = function () {
	return "<< " + this.members.map(stringify).join(', ') + " >>";
};

Record.prototype.repr = function (depth, fmt) {
	if (this.getIn(['tags', 'name'])) {
        return style.name(this.tags.name) + '( ... )';
	}

	let members = this.members.map(function(node) {
		return node.repr(depth, fmt);
	});

	return (
		style.delimiter("<<") + ' ' +
		members.join(style.delimiter(', ')) + ' ' +
		style.delimiter(">>")
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

