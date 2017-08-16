let AST = require('./ast');

function transform(func) {
	return function(node) {
		if (node && 'transform' in node) {
			return node.transform(func);
		} else {
			return func(node);
		}
	};
}

(function(AST) {
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
	AST.Function.prototype.transform = function (func) {
		return func(this.update('plist', function(plist) {
			return transform(func)(plist);
		}).update('block', function(block) {
			return transform(func)(block);
		}));
	};
	AST.Block.prototype.transform = function(func) {
		return func(this.update('exprs', function(exprs) {
			return exprs.map(transform(func));
		}));
	};
	AST.List.prototype.transform = function(func) {
		return func(this.update('items', function(list) {
			return list.map(transform(func));
		}));
	};
	AST.Map.prototype.transform = function(func) {
		return func(this.update('items', function(kvl) {
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
