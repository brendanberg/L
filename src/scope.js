const { Set, Map, Record } = require('immutable');
const _ = null;


let currentSymbol = 0;

function gensym() {
	return (++currentSymbol).toString(36).padStart(4, '0').toUpperCase();
}

const ScopedIdentifier = Record({label: _, scopes: Set([])});

ScopedIdentifier.prototype.toString = function() {
	return ('{' + this.label + '}['
		+ this.scopes.map((sym) => { return sym.toString() }).toArray().join(',')
		+ ']');
}


function Scope() {
	this.scope = Set([]);
	this.bindings = Map({});
}

Scope.prototype.toString = function() {
	let self = this;
	
	return ('{\n'
		+ (this.bindings.keySeq().map(function(it) {
				return it.toString() + ': ' + self.bindings.get(it).toString();
			}).join('\n')).replace(/(^|\n)/g, function (capture) { return capture + '  '; })
		+ '\n}');
};

Scope.prototype.addBinding = function(ident) {
	ident = new ScopedIdentifier({label: ident.label, scopes: ident.scopes});
	let binding = gensym();
	this.bindings = this.bindings.set(ident, binding);
	return binding;
};

Scope.prototype.resolve = function(ident) {
	ident = new ScopedIdentifier({label: ident.label, scopes: ident.scopes});

	let candidates = this.bindings.keySeq().filter((id) => {
		return (id.label == ident.label && id.scopes.isSubset(ident.scopes));
	});

	let bestMatch = candidates.reduce((bestMatch, id) => {
		if (id.scopes.intersect(ident.scopes).count()
				> bestMatch.scopes.intersect(ident.scopes).count()) {
			return id;
		} else {
			return bestMatch;
		}
	});

	return this.bindings.get(bestMatch);
};

module.exports = Scope;
