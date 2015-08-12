var Node = function (start, end) {
	this.start = start;
	this.end = end;
};

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
	Invocation: function (target, params, tags) {
		this.type = 'Invocation';
		this.tags = tags || {};
		this.target = target;
		this.params = params;
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
		this.ctx = null;
	},
	Assignment: function (identifier, value, tags) {
		this.type = 'Assignment';
		this.tags = tags || {};
		this.identifier = identifier;
		this.value = value;
	},
	Lookup: function (target, term, tags) {
		this.type = 'Lookup';
		this.tags = tags || {};
		this.target = target;
		this.term = term;
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
	},
	Bool: function(value, tags) {
		this.type = 'Boolean';
		this.tags = tags || {};
		this.value = value;
	},
	Bottom: function(tags) {
		this.type = 'Bottom';
		this.tags = tags || {};
	}
};

module.exports = AST;
