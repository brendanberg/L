var Node = function (start, end) {
	this.start = start;
	this.end = end;
};



var AST = {
	InfixExpression: function (op, lhs, rhs, parseOpts) {
		this.type = 'InfixExpression';
		this.op = op;
		this.lhs = lhs;
		this.rhs = rhs;
	},
	PrefixExpression: function (op, exp, parseOpts) {
		this.type = 'PrefixExpression';
		this.op = op;
		this.exp = exp;
	},
	Function: function (idList, block, parseOpts) {
		this.type = 'Function';
		this.identifierList = idList;
		this.block = block;
	},
	Block: function (expList, parseOpts) {
		this.type = 'Block';
		this.expressionList = expList;
	},
	List: function (expList, parseOpts) {
		this.type = 'List';
		this.expressionList = expList;
	},
	Dictionary: function (kvl, parseOpts) {
		this.type = 'Dictionary';
		this.kvl = kvl;
	},
	MessageSend: function (sender, reciever, message, parseOpts) {
		this.type = 'MessageSend';
		this.sender = sender;
		this.receiver = receiver;
		this.message = message;
	},
	InfixOperator: function (op, parseOpts) {
		this.type = 'InfixOperator';
		this.op = op;
	},
	PrefixOperator: function (op, parseOpts) {
		this.type = 'PrefixOperator';
		this.op = op;
	},
	IdentifierList: function (list, parseOpts) {
		this.type = 'IdentifierList';
		this.list = list;
	},
	Identifier: function (name, parseOpts) {
		this.type = 'Identifier';
		this.name = name;
	},
	ExpressionList: function (list, parseOpts) {
		this.type = 'ExpressionList';
		this.list = list;
	},
	KeyValueList: function (list, parseOpts) {
		this.type = 'KeyValueList';
		this.list = list;
	},
	KeyValuePair: function (key, val, parseOpts) {
		this.type = 'KeyValuePair';
		this.key = key;
		this.val = val;
	},
	Quote: function (exp, parseOpts) {
		this.type = 'Quote';
		this.exp = exp;
	},
	String: function (str, parseOpts) {
		this.type = 'String';
		this.value = str;
	},
	Integer: function (val, parseOpts) {
		this.type = 'Integer';
		this.value = val;
	},
	Rational: function (numerator, denominator, parseOpts) {
		this.type = 'Rational';
		this.numerator = numerator;
		this.denominator = denominator;
	},
	Decimal: function (numerator, exponent, parseOpts) {
		this.type = 'Decimal';
		this.numerator = numerator;
		this.exponent = exponent;
	},
	Real: function (mag, parseOpts) {
		this.type = 'Real';
		// Can be Integer, Rational, or Decimal.
		this.magnitude = mag;
	},
	Imaginary: function (mag, parseOpts) {
		this.type = 'Imaginary';
		// Can be Integer, Rational, Decimal, or Real.
		this.magnitude = mag;
	},
	Complex: function (real, imag, parseOpts) {
		this.type = 'Complex';
		this.real = real;
		this.imaginary = imag;
	}
};

AST.ExpressionList.prototype.eval = function (rt, ctx) {
	var val;
	for (var e in this.list) {
		if (this.list.hasOwnProperty(e) && e.hasOwnProperty('eval')) {
			val = e.eval(rt, ctx);
		}
	}
	this.value = val;
	return this.value;
}

AST.InfixExpression.prototype.eval = function (rt, ctx) {
	var lhs = this.lhs.eval(rt, ctx),
		msg = new AST.KeyValuePair(
			this.op, this.rhs.eval(rt, ctx)
		);
	
	var message = new AST.MessageSend(ctx, lhs, msg);
	this.value = message.eval(rt, ctx);
	return this.value;
}

AST.PrefixExpression.prototype.eval = function (rt, ctx) {
	var exp = this.exp.eval(rt, ctx),
		message = new AST.MessageSend(ctx, this.op);
	
	this.value = message.eval(rt, ctx);
	return this.value;
}

AST.Function.prototype.eval = function (rt, ctx) {
	return this;
}

AST.Block.prototype.eval = function (rt, ctx) {

}

AST.List.prototype.eval = function (rt, ctx) {

}

AST.Dictionary.prototype.eval = function (rt, ctx) {

}

AST.Identifier.prototype.eval = function (rt, ctx) {
	var message = new AST.MessageSend(_, ctx,
		new AST.KeyValuePair('__get__', this.name));
	this.value = message.eval(rt, ctx);
}

AST.Integer.prototype.eval = function (rt, ctx) {
	return this;
}

AST.MessageSend.prototype.eval = function (rt, ctx) {
	// TODO
}

AST.Integer.prototype.toString = function (rt, ctx) {
	return this.value.toString();
}

AST.Rational.prototype.eval = function (rt, ctx) {
	return this;
}

AST.Rational.prototype.toString = function (rt, ctx) {
	return this.numerator.value + " / " + this.denominator.value;
}

AST.Decimal.prototype.eval = function (rt, ctx) {
	return this;
}

AST.Decimal.prototype.toString = function (rt, ctx) {
	var wholePart = this.numerator / Math.pow(10, this.exponent),
		fractionPart = this.numerator % Math.pow(10, this.exponent);
	return wholePart + "." + fractionPart;
}

// === REAL ===

AST.Imaginary.prototype.eval = function (rt, ctx) {
	return this;
}

AST.Imaginary.prototype.toString = function (rt, ctx) {
	return this.value.toString() + "i";
}

AST.Complex.prototype.eval = function (rt, ctx) {
	return this;
}

AST.Complex.prototype.toString = function (rt, ctx) {
	return this.real.toString() + "+" + this.imaginary.toString();
}

module.exports = AST;

