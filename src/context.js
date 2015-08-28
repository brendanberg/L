var AST = require('./ast');

var Context = function() {
	
};

Context.prototype[':'] = function(identifier, value) {
	//TODO: walk up the contexts and find a value?
	this[identifier.name] = value;
};

// TODO: Should underscore be a special case in the parser?
Context.prototype['_'] = new AST.Bottom();

require('./impl/strings');
require('./impl/numbers');
require('./impl/collections');
require('./impl/blocks');
require('./impl/types');

module.exports = Context;
