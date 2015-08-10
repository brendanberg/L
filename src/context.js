var AST = require('./ast');

var Context = function() {
	
};

Context.prototype[':'] = function(identifier, value) {
	this[identifier.name] = value;
};

require('./impl/strings');
require('./impl/numbers');
module.exports = Context;
