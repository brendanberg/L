var AST = require('../ast');
var dispatch = require('../dispatch');

(function(AST) {
	AST.Struct.prototype.ctx = {
		'()': function() {
			console.log(this);
			var args = Array.prototype.slice.call(arguments);
			var values = {};
			for (var i = 0, len = this.members.length; i < len; i++) {
				values[this.members[i].key] = args[i];
			}
			return new AST.Value(this, values);
		}
	};
})(AST);
