require('mocha-testcheck').install();
const { List, Map, is } = require('immutable');
const L = require('../src/l');
const punycode = require('punycode');
const chai = require('chai');
const chaiImmutable = require('chai-immutable');
const assert = chai.assert;

chai.use(chaiImmutable);


let context = new L.Context();

check.isomorphism = (description, nodeList) => {
	check.it(description, nodeList, (node) => {
		let parsed = L.Parser.parse(node.toString()).transform(context, L.Rules);
		assert.equal(node, parsed.exprs.first());
	});
};

var lists = {
	digits: [0,1,2,3,4,5,6,7,8,9],
	powers: [0,1,2,3,4],
	alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXZYabcdefghijklmnopqrstuvwxyz_'.split(''),
	alphanum: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'.split(''),
	prefixOperator: '+-~!^'.split(''),
	infixOperator: ['//:', '//', '/:', '+:', '-:', '*:', '%:', '<=', '==',
		'!=', '>=', '..', '~>', '<~', '??', '+', '-', '*', '/', '%',
		'<', '>', '&', '|', '^'
	]
};

var Node = {};

// Numeric types

Node.integer = gen.map((n) => {
	return new L.AST.Integer({value: n, tags: Map({source_base: 10})});
}, gen.posInt);

Node.hex = gen.map((n) => {
	return new L.AST.Integer({value: n, tags: Map({source_base: 16})});
}, gen.posInt);

Node.decimal = gen.map((vals) => {
	return new L.AST.Decimal({numerator: vals[0], exponent: vals[1]});
}, gen.array([gen.intWithin(0, 10000), gen.returnOneOf(lists.powers)]));

Node.scientific = function() {
	return _;
};

Node.complex = gen.map((vals) => {
	return new L.AST.Complex({imaginary: vals[0], real: vals[1]});
}, gen.array(gen.oneOf([Node.integer, Node.hex, Node.decimal]), 2));

Node.number = gen.oneOf([
	Node.integer, Node.hex, Node.decimal/*, Node.complex, Node.scientific*/
]);


// Strings

Node.string = gen.map((s) => {
	return new L.AST.Text({value: List(punycode.ucs2.decode(s))});
}, gen.string);

Node.string__r = gen.map((s) => {
	return new L.AST.Text({value: List(punycode.ucs2.decode(s.join('')))});
}, gen.array(gen.returnOneOf(lists.alphanum), 3));


// Identifiers

Node.name = gen.map((args) => {
	return args[0] + args[1].join('');
}, gen.array([
	gen.returnOneOf(lists.alpha),
	gen.array(gen.returnOneOf(lists.alphanum), 2)
]));

Node.identifier = gen.map((args) => {
	return new L.AST.Identifier({
		label: args[0], 
		modifier: args[1]
	});
}, gen.array([Node.name, gen.returnOneOf([null, '?', '!'])]));



// Restricted Terms

Node.term__r = gen.oneOf([
	Node.identifier, Node.number, Node.string__r
]);

Node.prefixExpression = gen.map((args) => {
	return new L.AST.PrefixExpression({
		op: new L.AST.Operator({label: args[0]}),
		expr: args[1]
	});
}, gen.array([gen.returnOneOf(lists.prefixOperator), Node.term__r]));

Node.infixExpression__r = gen.map((args) => {
	return new L.AST.InfixExpression({
		op: new L.AST.Operator({label: args[0]}),
		lhs: args[1],
		rhs: args[2]
	});
}, gen.array([gen.returnOneOf(lists.infixOperator), Node.term__r, Node.term__r]));

Node.immediate = gen.map((exp) => {
	return new L.AST.Immediate({target: exp});
}, Node.term__r);

Node.list__r = gen.map((items) => {
	return new L.AST.List({items: List(items)});
}, gen.array(Node.identifier, 4));

Node.keyValuePair__r = gen.map((args) => {
	return new L.AST.KeyValuePair({key: args[0], val: args[1]});
}, gen.array([Node.identifier, Node.term__r]));

Node.dictionary__r = gen.map((args) => {
	return new L.AST.Map({items: List(args)});
}, gen.array(Node.keyValuePair__r, 4));

Node.plist = gen.map((items) => {
	return new L.AST.List({items: List(items)});
}, gen.array(Node.identifier, 3));

Node.expression__r = gen.oneOf([Node.prefixExpression, Node.infixExpression__r]);

Node.block = gen.map((items) => {
	return new L.AST.Block({
		exprs: List(items),
		tags: Map({envelopeShape: '{}'})
	});
}, gen.array(Node.expression__r, 3));

Node.function__r = gen.map((args) => {
	return new L.AST.Function({
		template: args[0],
		block: args[1]
	});
}, gen.array([
	Node.plist,
	Node.block
]));


// Terms

Node.term = gen.oneOf([
	/*Node.function__r,*/ Node.list__r, Node.dictionary__r, Node.identifier,
	Node.string__r, Node.number
]);

Node.infixExpression = gen.map((args) => {
	return new L.AST.InfixExpression({
		op: new L.AST.Operator({label: args[0]}),
		lhs: args[1],
		rhs: args[2]
	});
}, gen.array([gen.returnOneOf(lists.infixOperator), Node.term, Node.expression__r]));

Node.expression = gen.oneOf([Node.prefixExpression, Node.infixExpression]);

// Messages

Node.parameterList = gen.map((items) => {
	return List(items);
}, gen.array(Node.term__r));

Node.invocation__r = gen.map((args) => {
	return new L.AST.Invocation({
		target: args[0],
		args: args[1]
	});
}, gen.array([Node.identifier, Node.parameterList]));

Node.message__r = gen.map((args) => {
	return new L.AST.Message({identifier: args[0], plist: args[1]});
}, gen.array([Node.identifier, Node.parameterList]));

Node.messageSend__r = gen.map((message) => {
	return new L.AST.MessageSend({message: message});
}, Node.parameterList);

Node.messageSend = gen.map((args) => {
	return new L.AST.MessageSend({receiver: args[0], message: args[1]});
}, gen.array([
	Node.identifier,
	Node.parameterList
]));


/* -------------------------------------------------------------------------
   Test descriptions
   ------------------------------------------------------------------------- */

describe('Parser', function () {
	check.isomorphism('accepts hex values', [Node.hex]);
	check.isomorphism('accepts int values', [Node.integer]);
	check.isomorphism('accepts decimal values', [Node.decimal]);
	check.isomorphism('accepts assorted numeric values', [Node.number]);

	check.isomorphism('accepts string values', [Node.string]);
	check.isomorphism('accepts identifiers', [Node.identifier]);

	check.isomorphism('accepts prefix expressions on basic terms',
		[Node.prefixExpression]);
	check.isomorphism('accepts immediate override expressions on basic terms',
		[Node.immediate]);
	check.isomorphism('accepts infix expressions on basic terms',
		[Node.infixExpression__r]);
	check.isomorphism('accepts lists of basic terms',
		[Node.list__r]);
	check.isomorphism('accepts dictionaries of [id:term]',
		[Node.dictionary__r]);
	check.isomorphism('accepts basic functions',
		[Node.function__r]);

/*	check.isomorphism('accepts complex terms', [Node.term]);
	check.isomorphism('accepts complex expressions',
		[Node.expression]); */

	check.isomorphism('accepts basic function invocations', [Node.invocation__r]);
//	check.isomorphism('accepts message sends (w/o receiver)',
//		[Node.messageSend__r]);
//	check.isomorphism('accepts message sends (w/ receiver)',
//		[Node.messageSend]);
	check.isomorphism('accepts terms', [Node.term]);
//	check.isomorphism('accepts identifiers', [Node.identifier], {times: 1000});
});
