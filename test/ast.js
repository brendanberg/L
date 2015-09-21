var L = require('../build/l');
require('mocha-testcheck').install();
var assert = require('assert');


function parserIsomorphism(ast) {
	if (ast.type === 'MessageSend') {
		console.log(ast.toString());
	}
	assert.deepEqual(ast, L.Parser.parse(ast.toString()));
}

var lists = {
	digits: [0,1,2,3,4,5,6,7,8,9],
	digits20: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19],
	alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXZYabcdefghijklmnopqrstuvwxyz_'.split(''),
	alphanum: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'.split(''),
	prefixOperator: '+-~!^\\'.split(''),
	infixOperator: ['//:', '//', '/:', '+:', '-:', '*:', '%:', '<=', '==',
		'!=', '>=', '..', '~>', '<~', '??', '+', '-', '*', '/', '%',
		'<', '>', '&', '|', '^'
	]
};

var ASTgen = {};

// Numeric types

ASTgen.integer = gen.map(function(n) {
	return new L.AST.Integer(n, {source_base: 10});
}, gen.posInt);

ASTgen.hex = gen.map(function(n) {
	return new L.AST.Integer(n, {source_base: 16});
}, gen.posInt);

ASTgen.decimal = gen.map(function(vals) {
	return new L.AST.Decimal(vals[0], vals[1]);
}, gen.array([gen.posInt, gen.returnOneOf(lists.digits20)]));

ASTgen.scientific = function() {
	return _;
};

ASTgen.imaginary = gen.map(function(n) {
	return new L.AST.Imaginary(n);
}, gen.oneOf([ASTgen.integer, ASTgen.hex, ASTgen.decimal/*, ASTgen.scientific*/]));

ASTgen.number = gen.oneOf([
	ASTgen.integer, ASTgen.hex, ASTgen.decimal, ASTgen.imaginary/*, ASTgen.scientific*/
]);


// Strings

ASTgen.string = gen.map(function(s) {
	return new L.AST.String(s);
}, gen.string);

ASTgen.string__r = gen.map(function(s) {
	return new L.AST.String(s.join(''));
}, gen.array(gen.returnOneOf(lists.alphanum), 3));


// Identifiers

ASTgen.name = gen.map(function(args) {
	return args[0] + args[1].join('');
}, gen.array([
	gen.returnOneOf(lists.alpha),
	gen.array(gen.returnOneOf(lists.alphanum), 5)
]));

ASTgen.identifier = gen.map(function(args) {
	var ident = new L.AST.Identifier(args[0]);
	ident.tags['modifier'] = args[1];
	return ident;
}, gen.array([ASTgen.name, gen.returnOneOf([null, '?', '!'])]));



// Restricted Terms

ASTgen.term__r = gen.oneOf([
	ASTgen.identifier, ASTgen.number, ASTgen.string__r
]);

ASTgen.prefixExpression = gen.map(function(args) {
	return new L.AST.PrefixExpression(args[0], args[1]);
}, gen.array([gen.returnOneOf(lists.prefixOperator), ASTgen.term__r]));

ASTgen.infixExpression__r = gen.map(function(args) {
	return new L.AST.InfixExpression(args[0], args[1], args[2]);
}, gen.array([gen.returnOneOf(lists.infixOperator), ASTgen.term__r, ASTgen.term__r]));

ASTgen.list__r = gen.map(function(items) {
	return new L.AST.List(items, {source: 'list'});
}, gen.array(ASTgen.term__r));

ASTgen.keyValuePair__r = gen.map(function(args) {
	return new L.AST.KeyValuePair(args[0], args[1]);
}, gen.array([ASTgen.identifier, ASTgen.term__r]));

ASTgen.dictionary__r = gen.map(function(args) {
	return new L.AST.Dictionary(args);
}, gen.array(ASTgen.keyValuePair__r, 4));

ASTgen.plist = gen.map(function(items) {
	return new L.AST.List(items, {source: 'identifierList'});
}, gen.array(ASTgen.identifier, 3));

ASTgen.expression__r = gen.oneOf([ASTgen.prefixExpression, ASTgen.infixExpression__r]);

ASTgen.block = gen.map(function(items) {
	return new L.AST.Block(new L.AST.ExpressionList(items));
}, gen.array(ASTgen.expression__r, 3));

ASTgen.function__r = gen.map(function(args) {
	return new L.AST.Function(args[0], args[1], {type: 'thin'});
}, gen.array([
	ASTgen.plist,
	ASTgen.block
]));


// Terms

ASTgen.term = gen.oneOf([
	ASTgen.function__r, ASTgen.list__r, ASTgen.dictionary__r, ASTgen.identifier,
	ASTgen.string__r, ASTgen.number
]);

ASTgen.infixExpression = gen.map(function(args) {
	return new L.AST.InfixExpression(args[0], args[1], args[2]);
}, gen.array([gen.returnOneOf(lists.infixOperator), ASTgen.term, ASTgen.expression__r]));

ASTgen.expression = gen.oneOf([ASTgen.prefixExpression, ASTgen.infixExpression]);

// Messages

ASTgen.parameterList = gen.map(function(items) {
	return new L.AST.List(items, {source: 'parameterList'});
}, gen.array(gen.oneOf([ASTgen.term__r, ASTgen.keyValuePair__r])));

ASTgen.message__r = gen.map(function(args) {
	return new L.AST.Message(args[0], args[1]);
}, gen.array([ASTgen.identifier, ASTgen.parameterList]));

ASTgen.messageSend__r = gen.map(function(args) {
	return new L.AST.MessageSend(null, args[0], args[1]);
}, gen.array([
	ASTgen.identifier,
	ASTgen.message__r
]));


/* -------------------------------------------------------------------------
   Test descriptions
   ------------------------------------------------------------------------- */

describe('Parser', function () {
	check.it('accepts hex values', [ASTgen.hex], parserIsomorphism);
	check.it('accepts int values', [ASTgen.integer], parserIsomorphism);
	check.it('accepts decimal values', [ASTgen.decimal], parserIsomorphism);
	check.it('accepts assorted numeric values',
		[ASTgen.number], parserIsomorphism);

	check.it('accepts string values', [ASTgen.string], parserIsomorphism);
	check.it('accepts identifiers', [ASTgen.identifier], parserIsomorphism);

	check.it('accepts prefix expressions on basic terms',
		[ASTgen.prefixExpression], parserIsomorphism);
	check.it('accepts infix expressions on basic terms',
		[ASTgen.infixExpression__r], parserIsomorphism);
	check.it('accepts lists of basic terms',
		[ASTgen.list__r], parserIsomorphism);
	check.it('accepts dictionaries of [id:term]',
		[ASTgen.dictionary__r], parserIsomorphism);
	check.it('accepts basic functions',
		[ASTgen.function__r], parserIsomorphism);

	check.it('accepts complex terms', [ASTgen.term], parserIsomorphism);
	check.it('accepts complex expressions',
		[ASTgen.expression], parserIsomorphism);
	
	check.it('accepts message sends (w/o receiver)',
		[ASTgen.messageSend__r], parserIsomorphism);
	//check.it('accepts terms', [ASTgen.term], parserIsomorphism);
	//check.it('accepts identifiers', [ASTgen.identifier], parserIsomorphism, {times: 1000});
});
