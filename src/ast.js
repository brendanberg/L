var Node = function (start, end) {
	this.start = start;
	this.end = end;
};



var AST = {
	InfixExpression: function (op, exp1, exp2, parseOpts) {
		this.type = 'InfixExpression';
		this.op = op;
		this.exp1 = exp1;
		this.exp2 = exp2;
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

AST.InfixExpression.prototype.foo = function (foo) {
	bar;
};

AST.PrefixExpression.prototype.ddd = function (foo) {

};

module.exports = AST;
