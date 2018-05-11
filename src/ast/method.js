/*
   Method AST node
 */

const { Map, List, Record } = require('immutable');
const { TypeError } = require('../error');
const _Function = require('./function');
const Template = require('./template');
const _List = require('./list');
const _ = null;
const _map = Map({});
const _list = List([]);


let Method = Record({target: _, selector: _list, block: _, ctx: _, tags: _map}, 'Method');


Method.prototype.toString = function() {
	return (
		this.target.toString() + ' (' + this.selector.map(function(it) {
			return it.toString();
		}).join(', ') + ') -> ' + this.block.toString()
	);
};

Method.prototype.repr = function(depth, style) {
	return (
		this.target.repr(depth, style) + style.delimiter(' (') +
		this.selector.map(function(it) { return it.repr(depth, style); }).join(', ') +
		style.delimiter(') -> ') + this.block.repr(depth, style)
	);
}

Method.prototype.eval = function(ctx) {
	// Do some basic type checking (the target type must already exist).
	let typeStr = this.target.getIn(['tags', 'type']);
	let type = ctx.lookup(typeStr);

	if (!(type && 'registerSelector' in type)) {
		throw new TypeError("There is no type '" + typeStr + "'");
	}

	// Build the selector string.
	let selector = '(' + this.selector.reduce(function(result, x) {
		if (x._name === 'KeyValuePair') {
			if (x.key._name === 'Identifier') {
				return result + x.key.label + ':';
			} else if (x.key._name === 'Text') {
				return result + "'" + x.key.value + "':";
			} else if (x.key._name === 'Operator') {
				return result + "'" + x.key.label + "':";
			}
		} else if (x._name === 'Qualifier') {
			return result + '.' + x.label;
		} else if (x._name === 'Text') {
			return result + "'" + x.value + "'";
		}
	}, '') + ')';

	// Build the method implementation
	let templateItems = List([this.target]).concat(this.selector.filter(function(item) {
		return (item._name === 'KeyValuePair');
	}).map(function(item) {
		return item.val;
	}));

	let impl = new _Function({
		template: new Template({match: new _List({items: templateItems})}),
		block: this.block
	});

	// Associate the method implementation with the selector
	type.registerSelector(selector, impl);
	return this;
};

Method.prototype.transform = function(xform) {
	return this;
};

module.exports = Method;

