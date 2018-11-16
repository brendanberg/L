const { Set, Map, Record } = require('immutable');
const _ = null;


let currentSymbol = 0;

const gensym = () => (++currentSymbol).toString(36).padStart(4, '0').toUpperCase();


const ScopedIdentifier = Record({label: _, scope: Set([])});

ScopedIdentifier.prototype.toString = function() {
	return ('{' + this.label + '}['
		+ this.scope.map((sym) => sym.toString()).toArray().join(',')
		+ ']');
}


function Bindings() {
	this.bindings = Map({});
}

Bindings.prototype.addBinding = function(ident) {
	ident = new ScopedIdentifier({label: ident.label, scope: ident.scope});
	let binding = gensym();
	this.bindings = this.bindings.set(ident, binding);
	return binding;
};

Bindings.prototype.resolve = function(ident) {
	ident = new ScopedIdentifier({label: ident.label, scope: ident.scope});
	let candidates = this.bindings.keySeq().filter((id) => {
		return (id.label == ident.label && id.scope.isSubset(ident.scope));
	});

	let bestMatch = candidates.reduce((bestMatch, id) => {
		if (id.scope.intersect(ident.scope).count()
				> bestMatch.scope.intersect(ident.scope).count()) {
			return id;
		} else {
			return bestMatch;
		}
	});

	return this.bindings.get(bestMatch);
};

Bindings.prototype.resolveLocal = function(ident) {
	ident = new ScopedIdentifier({label: ident.label, scope: ident.scope});

	let match = this.bindings.keySeq().filter((id) => {
		return (id.label == ident.label && id.scope.equals(ident.scope));
	});

	if (match.count() !== 1) {
		return null;
	}

	return this.bindings.get(match.get(0));
};

module.exports = Bindings;

