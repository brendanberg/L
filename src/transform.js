var AST = require('./ast');

function transform(func) {
	return function(node) {
		if (node && 'transform' in node) {
			return node.transform(func);
		} else {
			return node;
		}
	};
}

(function(AST) {
	AST.Identifier.prototype.transform = function(func) {
		return func(this);
	};
	AST.ExpressionList.prototype.transform = function(func) {
		return func(this.update('list', function(list) {
			return list.map(transform(func));
		}));
	};
	AST.InfixExpression.prototype.transform = function(func) {
		return func(this.update('lhs', function(lhs) {
			return transform(func)(lhs);
		}).update('rhs', function(rhs) {
			return transform(func)(rhs);
		}));
	};
	AST.PrefixExpression.prototype.transform = function(func) {
		return func(this.update('exp', function(exp) {
			return transform(func)(exp);
		}));
	};
	AST.Block.prototype.transform = function(func) {
		return func(this.update('explist', function(explist) {
			return explist.map(transform(func));
		}));
	};
	AST.List.prototype.transform = function(func) {
		return func(this.update('list', function(list) {
			return list.map(transform(func));
		}));
	};
	AST.Dictionary.prototype.transform = function(func) {
		return func(this.update('kvlist', function(kvl) {
			return kvl.map(transform(func));
		}));
	};
	AST.KeyValuePair.prototype.transform = function(func) {
		// this.key = this.key.transform(func);
		return func(this.update('val', function(val) {
			return transform(func)(val);
		}));
	};
})(AST);
