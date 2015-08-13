var AST = require('./ast');

var Context = function() {
	
};

Context.prototype[':'] = function(identifier, value) {
	this[identifier.name] = value;
};

Context.prototype['True'] = new AST.Bool(true);
Context.prototype['False'] = new AST.Bool(false);
Context.prototype['_'] = new AST.Bottom();

require('./impl/strings');
require('./impl/numbers');
require('./impl/booleans');
require('./impl/collections');
require('./impl/blocks');
module.exports = Context;
