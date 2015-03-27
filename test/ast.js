var L = require('../src/parser');
require('mocha-testcheck').install();
var assert = require('assert');


function parserIsomorphism(ast) {
	assert.deepEqual(ast, L.Parser.parse(ast.toString()));
}

var lists = {
	digits: [0,1,2,3,4,5,6,7,8,9],
	digits20: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19],
	alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXZYabcdefghijklmnopqrstuvwxyz_'.split(''),
	alphanum: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'.split(''),
	prefixOperator: '+-~!^\\'.split(''),
	infixOperator: ['//:', '//', '/:', '+:', '-:', '*:', '%:', '<=', '==',
		'!=', '>=', '<-', '..', '~>', '<~', '??', '+', '-', '*', '/', '%',
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
}, gen.oneOf([ASTgen.integer, ASTgen.hex, ASTgen.decimal]));

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
	return new L.AST.PrefixExpression(new L.AST.PrefixOperator(args[0]), args[1]);
}, gen.array([gen.returnOneOf(lists.prefixOperator), ASTgen.term__r]));

ASTgen.infixExpression__r = gen.map(function(args) {
	var op = new L.AST.InfixOperator(args[0]);
	return new L.AST.InfixExpression(op, args[1], args[2]);
}, gen.array([
	gen.returnOneOf(lists.infixOperator),
	ASTgen.term__r,
	ASTgen.term__r
]));

ASTgen.list__r = gen.map(function(items) {
	return new L.AST.List(items, {source: 'list'});
}, gen.array(ASTgen.term__r));

ASTgen.dictionary__r = gen.map(function(args) {
	var kvl = [];

	for (var i in args) {
		kvl.push(new L.AST.KeyValuePair(args[i][0], args[i][1]));
	}

	return new L.AST.List(kvl, kvl.length ? {source: 'dictionary'} : {});
}, gen.array(gen.array([ASTgen.identifier, ASTgen.term__r]), 4));

ASTgen.plist = gen.map(function(items) {
	return new L.AST.List(items, {source: 'identifierList'});
}, gen.array(ASTgen.identifier, 3));

ASTgen.expression__r = gen.oneOf([ASTgen.prefixExpression, ASTgen.infixExpression]);

ASTgen.function__r = gen.map(function(args) {
	return new L.AST.Function(args[0], new L.AST.Block(args[1]), {type: args[2]});
}, gen.array([
	ASTgen.plist,
	gen.array(ASTgen.term__r, 3),
	gen.returnOneOf(['fat', 'thin'])
]));

// Terms

ASTgen.term = gen.oneOf([
	ASTgen.function, ASTgen.list__r, ASTgen.dictionary__r, ASTgen.identifier,
	ASTgen.string__r, ASTgen.number
]);


describe('Parser', function () {
	check.it('accepts hex values', [ASTgen.hex], parserIsomorphism);
	check.it('accepts int values', [ASTgen.integer], parserIsomorphism);
	check.it('accepts decimal values', [ASTgen.decimal], parserIsomorphism);
	check.it('accepts assorted numeric values', [ASTgen.number], parserIsomorphism);

	check.it('accepts string values', [ASTgen.string], parserIsomorphism);
	check.it('accepts identifiers', [ASTgen.identifier], parserIsomorphism);

	check.it('accepts prefix expressions on terms', [ASTgen.prefixExpression], parserIsomorphism);
	check.it('accepts infix expressions on terms', [ASTgen.infixExpression__r], parserIsomorphism);
	check.it('accepts lists of terms', [ASTgen.list__r], parserIsomorphism);
	check.it('accepts dictionaries of [id:term]', [ASTgen.dictionary__r], parserIsomorphism);
	check.it('accepts functions of (id)=>{}', [ASTgen.function__r], parserIsomorphism);

	//check.it('accepts terms', [ASTgen.term], parserIsomorphism);
	//check.it('accepts identifiers', [ASTgen.identifier], parserIsomorphism, {times: 1000});
});
