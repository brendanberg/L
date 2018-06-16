/*
   Method AST node
 */

const { Map, List, Set, Record } = require('immutable');
const punycode = require('punycode');
const { TypeError } = require('../error');
const _Function = require('./function');
const _List = require('./list');
const Identifier = require('./identifier');
const _ = null;
const _map = Map({});
const _list = List([]);


let Method = Record({target: _, selector: _list, block: _, scope: _, tags: _map}, 'Method');


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
	let ident = new Identifier({
		label: this.target.getIn(['tags', 'type']),
		scope: this.scope
	});
	// TODO: PROBABLY ADD SCOPES HERE!!!
	let type = ctx.get(ctx.scope.resolve(ident));

	if (!(type && 'registerSelector' in type)) {
		throw new TypeError("There is no type '" + ident.label + "'");
	}

	// Build the selector string.
	let selector = '(' + this.selector.reduce(function(result, x) {
		if (x._name === 'KeyValuePair') {
			if (x.key._name === 'Identifier') {
				return result + x.key.label + ':';
			} else if (x.key._name === 'Text') {
				return result + "'" + punycode.ucs2.encode(x.key.value) + "':";
			} else if (x.key._name === 'Operator') {
				return result + "'" + x.key.label + "':";
			}
		} else if (x._name === 'Symbol') {
			return result + x.label + '.';
		} else if (x._name === 'Text') {
			return result + "'" + punycode.ucs2.encode(x.value) + "'";
		}
	}, '') + ')';

	// Build the method implementation
	let templateItems = List([this.target]).concat(this.selector.filter(function(item) {
		return (item._name === 'KeyValuePair');
	}).map(function(item) {
		return item.val;
	}));

	let impl = new _Function({
		template: new _List({items: templateItems}),
		block: this.block,
		scope: this.scope
	});

	// Associate the method implementation with the selector
	type.registerSelector(selector, impl);
	return this;
};

Method.prototype.transform = function(func) {
	let transform = (node) => {
		return node && ('transform' in node) ? node.transform(func) : func(node);
	};

	return func(this.update('target', (target) => {
		return transform(target);
	}).update('selector', (sel) => {
		return sel.map((val) => { return transform(val); });
	}).update('block', (block) => {
		return transform(block);
	}));
};

module.exports = Method;

