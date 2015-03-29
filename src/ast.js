var Node = function (start, end) {
	this.start = start;
	this.end = end;
};

function stringify(node) {
	return node.toString();
}

function clone(obj) {
	if (obj == null || typeof obj !== 'object') { return obj; }
	var copy = obj.constructor();
	for (var attr in obj) {
		if (obj.hasOwnProperty(attr)) { copy[attr] = obj[attr]; }
	}
	return copy;
};

var AST = {
	InfixExpression: function (op, lhs, rhs, tags) {
		this.type = 'InfixExpression';
		this.tags = tags || {};
		this.op = op;
		this.lhs = lhs;
		this.rhs = rhs;
	},
	PrefixExpression: function (op, exp, tags) {
		this.type = 'PrefixExpression';
		this.tags = tags || {};
		this.op = op;
		this.exp = exp;
	},
	Function: function (plist, block, tags) {
		this.type = 'Function';
		this.tags = tags || {};
		this.plist = plist;
		this.block = block;
		this.ctx = null;
	},
	Block: function (expList, tags) {
		this.type = 'Block';
		this.tags = tags || {};
		this.expressionList = expList;
	},
	List: function (list, tags) {
		this.type = 'List';
		this.tags = tags || {};
		this.list = list;
	},
	Dictionary: function (kvl, tags) {
		this.type = 'Dictionary';
		this.tags = tags || {};
		this.kvl = kvl;
	},
	Message: function (identifier, params, tags) {
		this.type = 'Message';
		this.tags = tags || {};
		this.identifier = identifier;
		this.params = params || null;
	},
	MessageSend: function (sender, receiver, message, tags) {
		this.type = 'MessageSend';
		this.tags = tags || {};
		this.sender = sender;
		this.receiver = receiver;
		this.message = message;
	},
	InfixOperator: function (op, tags) {
		this.type = 'InfixOperator';
		this.tags = tags || {};
		this.op = op;
	},
	PrefixOperator: function (op, tags) {
		this.type = 'PrefixOperator';
		this.tags = tags || {};
		this.op = op;
	},
	IdentifierList: function (list, tags) {
		this.type = 'IdentifierList';
		this.tags = tags || {};
		this.list = list;
	},
	Identifier: function (name, tags) {
		this.type = 'Identifier';
		this.tags = tags || {};
		this.name = name;
	},
	ExpressionList: function (list, tags) {
		this.type = 'ExpressionList';
		this.tags = tags || {};
		this.list = list;
	},
	KeyValueList: function (list, tags) {
		this.type = 'KeyValueList';
		this.tags = tags || {};
		this.list = list;
	},
	KeyValuePair: function (key, val, tags) {
		this.type = 'KeyValuePair';
		this.tags = tags || {};
		this.key = key;
		this.val = val;
	},
	Quote: function (exp, tags) {
		this.type = 'Quote';
		this.tags = tags || {};
		this.exp = exp;
	},
	String: function (str, tags) {
		this.type = 'String';
		this.tags = tags || {};
		this.value = str;
	},
	Integer: function (val, tags) {
		this.type = 'Integer';
		this.tags = tags || {};
		this.value = val;
	},
	Rational: function (numerator, denominator, tags) {
		this.type = 'Rational';
		this.tags = tags || {};
		this.numerator = numerator;
		this.denominator = denominator;
	},
	Decimal: function (numerator, exponent, tags) {
		this.type = 'Decimal';
		this.tags = tags || {};
		this.numerator = numerator;
		this.exponent = exponent;
	},
	Scientific: function (significand, mantissa, tags) {
		this.type = 'Scientific';
		this.tags = tags || {};
		this.sig = significand;
		this.mant = mantissa;
	},
	Real: function (mag, tags) {
		this.type = 'Real';
		this.tags = tags || {};
		// Can be Integer, Rational, or Decimal.
		this.magnitude = mag;
	},
	Imaginary: function (mag, tags) {
		this.type = 'Imaginary';
		this.tags = tags || {};
		// Can be Integer, Rational, Decimal, or Real.
		this.magnitude = mag;
	},
	Complex: function (real, imag, tags) {
		this.type = 'Complex';
		this.tags = tags || {};
		this.real = real;
		this.imaginary = imag;
	}
};

AST.InfixExpression.prototype.eval = function (rt, ctx) {
	var lhs = this.lhs.eval(rt, ctx);
	var rhs = this.rhs.eval(rt, ctx);
	var msg = new AST.Message(
		new AST.Identifier(this.op.op),
		new AST.List([rhs], {source: 'parameterList'})
	);
	
	var msgSend = new AST.MessageSend(ctx, lhs, msg);
	this.value = msgSend.eval(rt, ctx);
	return this.value;
};

AST.InfixExpression.prototype.toString = function () {
	return this.lhs.toString() + ' ' + this.op.op + ' ' + this.rhs.toString();
};

AST.PrefixExpression.prototype.eval = function (rt, ctx) {
	var exp = this.exp.eval(rt, ctx);
	var message = new AST.MessageSend(ctx, exp, new AST.Message(new AST.Identifier(this.op.op)));
	
	this.value = message.eval(rt, ctx);
	return this.value;
};

AST.PrefixExpression.prototype.toString = function() {
	return this.op.op + this.exp.toString();
};

AST.Function.prototype.eval = function (rt, ctx) {
	this.ctx = ctx;
	return this;
};

AST.Function.prototype.toString = function() {
	var arrow = ({fat: ' => ', thin: ' -> '})[this.tags['type'] || 'thin'];
	return this.plist.toString() + arrow + this.block.toString();
};

AST.Block.prototype.eval = function (rt, ctx) {

};

AST.Block.prototype.toString = function () {
	return '{\n' + this.expressionList.toString() + '\n}';
};

AST.List.prototype.eval = function (rt, ctx) {
	return this;
};

AST.List.prototype.toString = function() {
	var map = {
		dictionary: function(s) { return '[' + s + ']'; },
		list: function(s) { return '[' + s + ']'; },
		identifierList: function(s) { return '(' + s + ')'; },
		parameterList: function(s) { return '(' + s + ')'; }
	};
	return map[this.tags['source'] || 'list'](this.list.map(stringify).join(', '));
};

AST.Dictionary.prototype.eval = function (rt, ctx) {
	return this;
};

AST.Dictionary.prototype.toString = function() {
	return '[' + this.kvl.map(stringify).join(', ') + ']';
};

AST.MessageSend.prototype.eval = function (rt, ctx) {
	var selector = (this.receiver ? this.receiver.ctx : ctx)[this.message.identifier.name];

	if (selector && typeof selector === 'function') {
		var evaluate = function (x) { return x.eval(rt, ctx) };
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
			scope[selector.plist.list[i].name] = this.message.params.list[i].eval(rt, ctx);
		}

		for (var i = 0, len = selector.block.expressionList.length; i < len; i++) {
			value = selector.block.expressionList[i].eval(rt, scope);
		}

		return value;
	} else {
		return selector;
	}
};

AST.MessageSend.prototype.toString = function () {
	return (this.receiver ? this.receiver.toString() : '') + this.message.toString();
};

AST.Message.prototype.toString = function () {
	return '.' + this.identifier.toString() + (this.params ? this.params.toString() : '');
};

AST.IdentifierList.prototype.eval = function (rt, ctx) {

};

AST.Identifier.prototype.eval = function (rt, ctx) {
	this.value = ctx[this.name];

	return this.value;
};

AST.Identifier.prototype.toString = function () {
	return this.name + (this.tags['modifier'] || '');
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
	return '[\n' + pairs + '\n]';
};

AST.KeyValuePair.prototype.eval = function (rt, ctx) {
	
};

AST.KeyValuePair.prototype.toString = function () {
	return this.key.toString() + ': ' + this.val.toString();
};

AST.Quote.prototype.eval = function (rt, ctx) {

};

AST.String.prototype.eval = function (rt, ctx) {
	return this;
};

AST.String.prototype.toString = function () {
	// Returns a quoted, escaped string suitable for input into the parser
	// By default we use single quotes. We replace newline, tab, and backslash
	// characters with their escaped selves. If the string contains both a
	// single and double quote character, we escape any instances of single
	// quotes and return the string. If the only unescaped quote character in
	// the string is single quote, we escape any instances of double quotes
	// and use double quotes as delimiters.

	var quote = "'";
	var ret = this.value.replace(/[\n\t\\]/g, function(match) {
		return ({
			"\n": "\\n",
			"\t": "\\t",
			"\\": "\\\\"
		})[match];
	});

	if (this.value.indexOf("'") !== -1) {
		if (this.value.indexOf('"') !== -1) {
			// String contains both ' and ".
			ret = ret.replace(/'/g, "\\'");
		} else {
			ret = ret.replace(/"/g, '\\"');
			quote = '"';
		}
	}
	return quote + ret + quote;
};

AST.Integer.prototype.eval = function (rt, ctx) {
	return this;
};

AST.Integer.prototype.ctx = {
	'+': function(other) { return new AST.Integer(this.value + other.value); },
	'-': function(other) { return new AST.Integer(this.value - other.value); },
	'*': function(other) { return new AST.Integer(this.value * other.value); },
	'/': function(other) { return new AST.Rational(this, other); }
};

AST.Integer.prototype.toString = function () {
	var baseMap = {
		10: function(x) { return x.toString(); },
		16: function(x) { return '0x' + x.toString(16).toUpperCase(); }
	};
	return baseMap[this.tags['source_base'] || 10](this.value);
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
	var exponent = Math.pow(10, this.exponent);
	var wholePart = Math.floor(this.numerator / exponent);
	var fraction = this.exponent ? this.zeroPad(this.numerator % exponent, this.exponent) : '';
	return wholePart.toString() + "." + fraction;
}

AST.Decimal.prototype.zeroPad = function (num, len) {
	var n = Math.abs(num);
	var zeros = Math.max(0, len - Math.floor(n).toString().length);
	var zeroString = Math.pow(10, zeros).toString().substr(1);
	if (num < 0) {
		zeroString = '-' + zeroString;
	}
	return zeroString + n;
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

