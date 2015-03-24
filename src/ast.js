var Node = function (start, end) {
	this.start = start;
	this.end = end;
};

function stringify(node) {
	return node.toString();
}

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
	List: function (list, parseOpts) {
		this.type = 'List';
		this.list = list;
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

AST.InfixExpression.prototype.eval = function (rt, ctx) {
	var lhs = this.lhs.eval(rt, ctx),
		msg = new AST.KeyValuePair(
			this.op, this.rhs.eval(rt, ctx)
		);
	
	var message = new AST.MessageSend(ctx, lhs, msg);
	this.value = message.eval(rt, ctx);
	return this.value;
};

AST.InfixExpression.prototype.toString = function () {
	return this.lhs.toString() + ' ' + this.op.op + ' ' + this.rhs.toString();
};

AST.PrefixExpression.prototype.eval = function (rt, ctx) {
	var exp = this.exp.eval(rt, ctx),
		message = new AST.MessageSend(ctx, this.op);
	
	this.value = message.eval(rt, ctx);
	return this.value;
};

AST.PrefixExpression.prototype.toString = function() {
	return this.op.op + this.exp.toString();
};

AST.Function.prototype.eval = function (rt, ctx) {
	return this;
};

AST.Block.prototype.eval = function (rt, ctx) {

};

AST.List.prototype.eval = function (rt, ctx) {

};

AST.List.prototype.toString = function() {
	return '[' + this.list.map(stringify).join(', ') + ']';
};

AST.Dictionary.prototype.eval = function (rt, ctx) {

};

AST.Dictionary.prototype.toString = function() {
	return '{' + this.kvl.map(stringify).join(', ') + '}';
};

AST.MessageSend.prototype.eval = function (rt, ctx) {

};

AST.MessageSend.prototype.toString = function () {
	return this.receiver.toString() + ' <- ' + this.message.toString();
}

AST.IdentifierList.prototype.eval = function (rt, ctx) {

};

AST.IdentifierList.prototype.toString = function () {
	return this.list.map(stringify).join(', ');
};

AST.Identifier.prototype.eval = function (rt, ctx) {
	var message = new AST.MessageSend(_, ctx,
		new AST.KeyValuePair('__get__', this.name));
	this.value = message.eval(rt, ctx);
};

AST.Identifier.prototype.toString = function () {
	return this.name;
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
};

AST.ExpressionList.prototype.toString = function () {
	var list = this.list.map(stringify).join('\n');
	return list;
};

AST.KeyValueList.prototype.eval = function (rt, ctx) {

};

AST.KeyValueList.prototype.toString = function () {
	var pairs = this.list.map(stringify).join('\n');
	return '{\n' + pairs + '\n}';
};

AST.KeyValuePair.prototype.eval = function (rt, ctx) {
	
};

AST.KeyValuePair.prototype.toString = function () {
	return this.key + ': ' + this.val;
};

AST.Quote.prototype.eval = function (rt, ctx) {

};

AST.String.prototype.eval = function (rt, ctx) {
	return this;
};

AST.String.prototype.toString = function () {
	var quote = "'";
	var ret = this.value;

	if (this.value.indexOf("'") !== -1) {
		if (this.value.indexOf('"') !== -1) {
			// String contains both ' and ".
			ret = ret.replace(/'/g, "\\'");
		} else {
			quote = '"';
		}
	}

	return quote + ret + quote;
};

AST.Integer.prototype.eval = function (rt, ctx) {
	return this;
};

AST.Integer.prototype.toString = function () {
	return this.value.toString();
};

AST.Rational.prototype.eval = function (rt, ctx) {
	return this;
}

AST.Rational.prototype.toString = function () {
	return this.numerator.value.toString() + " / " + this.denominator.value.toString();
}

AST.Decimal.prototype.eval = function (rt, ctx) {
	return this;
}

AST.Decimal.prototype.toString = function () {
	var wholePart = Math.floor(this.numerator / Math.pow(10, this.exponent)),
		fractionPart = this.numerator % Math.pow(10, this.exponent);
	return wholePart.toString() + "." + fractionPart.toString();
}

// TODO: === REAL ===

AST.Imaginary.prototype.eval = function (rt, ctx) {
	return this;
}

AST.Imaginary.prototype.toString = function () {
	return this.magnitude.toString() + "i";
}

AST.Complex.prototype.eval = function (rt, ctx) {
	return this;
}

AST.Complex.prototype.toString = function () {
	return this.real.toString() + "+" + this.imaginary.toString();
}

module.exports = AST;

