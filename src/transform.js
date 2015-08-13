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
		this.list = this.list.map(transform(func));
		return func(this);
	};
	AST.InfixExpression.prototype.transform = function(func) {
		this.lhs = transform(func)(this.lhs);
		this.rhs = transform(func)(this.rhs);
		return func(this);
	};
	AST.PrefixExpression.prototype.transform = function(func) {
		this.exp = transform(func)(this.exp);
		return func(this);
	};
	AST.Block.prototype.transform = function(func) {
		this.expressionList = this.expressionList.map(transform(func));
		return func(this);
	};
	AST.List.prototype.transform = function(func) {
		this.list = this.list.map(transform(func));
		return func(this);
	};
	AST.Dictionary.prototype.transform = function(func) {
		this.kvl = this.kvl.map(transform(func));
		return func(this);
	};
	AST.KeyValuePair.prototype.transform = function(func) {
		// this.key = this.key.transform(func);
		this.value = transform(func)(this.value);
		return func(this);
	};
})(AST);
