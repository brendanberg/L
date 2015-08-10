var AST = require('./ast');
var Context = require('./context');

(function(AST) {
	function clone(obj) {
		if (obj == null || typeof obj !== 'object') { return obj; }
		var copy = obj.constructor();
		for (var attr in obj) {
			if (obj.hasOwnProperty(attr)) { copy[attr] = obj[attr]; }
		}
		return copy;
	};

	function gcd(a, b) {
		// Yikes, JS maths o_O
		if (b == 0) { return a; }
		return gcd(b, a % b);
	}
	
	AST.ExpressionList.prototype.eval = function(ctx) {
		var val;
		for (var i = 0, len = this.list.length; i < len; i++) {
			if ('eval' in this.list[i]) {
				val = this.list[i].eval(ctx);
			}
		}
		this.value = val;
		return this.value;
	};

	AST.PrefixExpression.prototype.eval = function (ctx) {
		var exp = this.exp.eval(ctx);
		var msg = new AST.Message(
			new AST.Identifier(this.op.op),
			new AST.List([], {source: 'parameterList'})
		);
		var msgSend = new AST.MessageSend(ctx, exp, msg);
		this.value = msgSend.eval(ctx);
		return this.value;
	};

	AST.InfixExpression.prototype.eval = function (ctx) {
		var msg, expr;

		if (this.op.op === ':') {
			// Special case for assignment. Probably make this a macro at
			// some point, but not now bc I need assignment and I haven't
			// built macros yet.
			expr = new AST.Assignment(this.lhs, this.rhs.eval(ctx));
		} else {
			msg = new AST.Message(
				new AST.Identifier(this.op.op),
				new AST.List([this.rhs.eval(ctx)], {source: 'parameterList'})
			);
			expr = new AST.MessageSend(ctx, this.lhs.eval(ctx), msg);
		}

		this.value = expr.eval(ctx);
		return this.value;
	};

	AST.Assignment.prototype.eval = function(ctx) {
		ctx[':'].call(ctx, this.identifier, this.value);
	};

	AST.Invocation.prototype.eval = function(ctx) {
		var func = this.target.eval(ctx); // Should verify we got a function
		var contxt = new Context();
		var params = func.plist.list;

		for (var i = 0, len = params.length; i < len; i++) {
			contxt[params[i].name] = this.params.list[i].eval(ctx);
		}

		var expList = new AST.ExpressionList(func.block.expressionList);
		return expList.eval(contxt);
	};

	AST.MessageSend.prototype.eval = function(ctx) {
		var receiver = this.receiver ? this.receiver.ctx : ctx;
		var selector = receiver[this.message.identifier.name];

		if (selector && typeof selector === 'function') {
			var evaluate = function (x) { return x.eval(ctx) };
			return selector.apply(this.receiver, this.message.params.list.map(evaluate));
		} else if (selector && selector.type === 'Function') {
			// Eval the function ugh
			var scope;
			var value = null;

			if (selector.plist.length !== this.message.params.length) {
				throw 'Method signatures do not match';
			}

			scope = clone(selector.ctx);

			for (var i = 0, len = selector.plist.list.length; i < len; i++) {
				scope[selector.plist.list[i].name] = this.message.params.list[i].eval(ctx);
			}

			for (var i = 0, len = selector.block.expressionList.length; i < len; i++) {
				value = selector.block.expressionList[i].eval(scope);
			}

			return value;
		} else {
			return selector;
		}
	};

	AST.Function.prototype.eval = function(ctx) {
		this.ctx = ctx;
		return this;
	};

	AST.Block.prototype.eval = function(ctx) {
		this.ctx = ctx;
		return this;
	};

	AST.Identifier.prototype.eval = function(ctx) {
		return ctx[this.name];
	};

	AST.KeyValuePair.prototype.eval = function(ctx) {
		ctx[this.key.eval(ctx)] = this.val.eval(ctx);
		return this;
	};

	AST.Dictionary.prototype.eval = function(ctx) {
		var kvl = {};
		console.log('dictionary!');
		for (var i = 0, len = this.kvl.length; i < len; i++) {
			console.log(this.kvl[i]);
			var key = this.kvl[i].key;
			kvl[key] = this.kvl[i].val.eval(ctx);
		}

		return new Dictionary(kvl, this.tags);
	};



	AST.List.prototype.eval = function(ctx) {
		var list = this.list.map(function(n){ return n.eval(ctx); })
		return new AST.List(list, this.tags);
	};

	AST.String.prototype.eval = function(ctx) {
		return this;
	};

	AST.Integer.prototype.eval = function(ctx) {
		return this;
	};

	AST.Rational.prototype.simplify = function(ctx) {
		var x = gcd(this.numerator, this.denominator);
		return new AST.Rational(
			this.numerator / x,
			this.denominator / x
		);
	};

	AST.Rational.prototype.eval = function(ctx) {
		// Simplify the fraction first
		return this.simplify(ctx);
	};

	AST.Decimal.prototype.eval = function(ctx) {
		return this;
	};

	AST.Scientific.prototype.eval = function(ctx) {
		return this;
	};

	AST.Imaginary.prototype.eval = function(ctx) {
		return this;
	};

	AST.Complex.prototype.eval = function(ctx) {
		return this;
	};
})(AST);
