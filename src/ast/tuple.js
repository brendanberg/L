
const { Map, List, Record } = require('immutable');
const _ = null;
const _map = Map({});
const _list = List([]);


Tuple = Record({label: _, values: _list, tags: _map}, 'Tuple');

Object.defineProperty(Tuple.prototype, 'scope', {
	get() {
		if (this._scope === undefined) {
			this._scope = Symbol();
		}
		return this._scope;
	},
	set(scope) { this._scope = scope; }
});

Tuple.prototype.toString = function () {
	if (this.values.count()) {
		let values = this.values.map(function(val) { return val.toString(); });
		return '.' + this.label + '(' + values.join(', ') + ')';
	} else {
		return '.' + this.label;
	}
};

Tuple.prototype.repr = function(depth, style) {
	if (this.values.count()) {
		let values = this.values.map(function(val) { return val.repr(depth, style); });
		return (
			style.name('.' + this.label) + style.delimiter('(') +
			values.join(style.delimiter(', ')) + style.delimiter(')')
		);
	} else {
		return style.name('.' + this.label);
	}
};

Tuple.prototype.eval = function(ctx) {
	ctx.set(this, this);
	return this;
};

Tuple.prototype.transform = function(func) {
	let transform = (node) => {
		return node && (node.transform) ? node.transform(func) : func(node);
	};

	return func(this.update('values', (values) => {
		return values.map((val) => { return transform(val); });
	}));
};

module.exports = Tuple;

