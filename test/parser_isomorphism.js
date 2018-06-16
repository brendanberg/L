require('mocha-testcheck').install();
const { List, Map, Set, is } = require('immutable');
const L = require('../src/l');
const punycode = require('punycode');
const chai = require('chai');
const chaiImmutable = require('chai-immutable');
const assert = chai.assert;

chai.use(chaiImmutable);

let Node = {};
let scopes = new L.Scope();


// ---------------------------------------------------------------------------
// Test Descriptions
// ---------------------------------------------------------------------------

let parser_description = function () {
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
		[Node.simple_infixExpression]);
	check.isomorphism('accepts lists of basic terms',
		[Node.simple_list]);
	check.isomorphism('accepts dictionaries of [id:term]',
		[Node.simple_dictionary]);
	check.isomorphism('accepts basic functions',
		[Node.simple_function]);

	check.isomorphism('accepts complex terms', [Node.term]);
	check.isomorphism('accepts complex expressions',
		[Node.expression]);

	check.isomorphism('accepts basic function invocations', [Node.simple_invocation]);
//	check.isomorphism('accepts message sends (w/o receiver)',
//		[Node.simple_messageSend]);
//	check.isomorphism('accepts message sends (w/ receiver)',
//		[Node.messageSend]);
	check.isomorphism('accepts terms', [Node.term]);
	check.isomorphism('accepts identifiers', [Node.identifier], {times: 1000});
};


// ---------------------------------------------------------------------------
// Generator Definitions
// ---------------------------------------------------------------------------

let lists = {
	digits: [0,1,2,3,4,5,6,7,8,9],
	powers: [0,1,2,3,4],
	alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXZYabcdefghijklmnopqrstuvwxyz_'.split(''),
	alphanum: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'.split(''),
	prefixOperator: '+-~!^'.split(''),
	infixOperator: ['+', '-', '*', '/', '%', '<', '>', '^', '==', '!=', '>=',
		'//:', '//', '/:', '+:', '-:', '*:', '%:', '<=', '==',
		'..', '~>', '<~', '??', '&', '|'
	]
};


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

Node.simple_string = gen.map((s) => {
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
		modifier:args[1],
	});
}, gen.array([Node.name, gen.returnOneOf([null, '?', '!'])]));

Node.plist_identifier = gen.map((args) => {
	return new L.AST.Identifier({
		label: args[0], 
		modifier: args[1],
		tags: Map({'introduction': true, 'local': true})
	});
}, gen.array([Node.name, gen.returnOneOf([null, '?', '!'])]));



// Restricted Terms

Node.simple_term = gen.oneOf([
	Node.identifier, Node.number, Node.simple_string
]);

Node.prefixExpression = gen.map((args) => {
	return new L.AST.PrefixExpression({
		op: new L.AST.Operator({label: args[0]}),
		expr: args[1]
	});
}, gen.array([gen.returnOneOf(lists.prefixOperator), Node.simple_term]));

Node.simple_infixExpression = gen.map((args) => {
	return new L.AST.InfixExpression({
		op: new L.AST.Operator({label: args[0]}),
		lhs: args[1],
		rhs: args[2]
	});
}, gen.array([gen.returnOneOf(lists.infixOperator), Node.simple_term, Node.simple_term]));

Node.immediate = gen.map((exp) => {
	return new L.AST.Immediate({target: exp});
}, Node.simple_term);

Node.simple_list = gen.map((items) => {
	return new L.AST.List({items: List(items)});
}, gen.array(Node.identifier, 4));

Node.simple_keyValuePair = gen.map((args) => {
	return new L.AST.KeyValuePair({key: args[0], val: args[1]});
}, gen.array([Node.identifier, Node.simple_term]));

Node.simple_dictionary = gen.map((args) => {
	return new L.AST.Map({items: List(args)});
}, gen.array(Node.simple_keyValuePair, 4));

Node.plist = gen.map((items) => {
	return new L.AST.List({items: List(items)});
}, gen.array(Node.plist_identifier, 3));

Node.simple_expression = gen.oneOf([Node.prefixExpression, Node.simple_infixExpression]);

Node.block = gen.map((items) => {
	return new L.AST.Block({
		exprs: List(items),
		tags: Map({envelopeShape: '{}'})
	});
}, gen.array(Node.simple_expression, 3));

Node.simple_function = gen.map((args) => {
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
	/*Node.simple_function,*/ Node.simple_list, Node.simple_dictionary, Node.identifier,
	Node.simple_string, Node.number
]);

Node.infixExpression = gen.map((args) => {
	return new L.AST.InfixExpression({
		op: new L.AST.Operator({label: args[0]}),
		lhs: args[1],
		rhs: args[2]
	});
}, gen.array([gen.returnOneOf(lists.infixOperator), Node.term, Node.term]));//Node.simple_expression]));

Node.expression = gen.oneOf([Node.prefixExpression, Node.infixExpression]);

// Messages

Node.parameterList = gen.map((items) => {
	return List(items);
}, gen.array(Node.simple_term));

function selectorFromMessage(message) {
	return '(' + message.map(function(arg) {
		if (arg._name === 'KeyValuePair') {
			if (arg.key._name === 'Identifier') {
				return arg.key.label + ':';
			} else if (arg.key._name === 'Text') {
				return arg.key.value + ':';
			}
		} else if (arg._name === 'Symbol') {
			return arg.label + '.';
		} else if (arg._name === 'Text') {
			return arg.value;
		}
	}).join('') + ')';
};

Node.simple_invocation = gen.map((args) => {
	return new L.AST.Invocation({
		target: args[0],
		selector: selectorFromMessage(args[1]),
		args: args[1]
	});
}, gen.array([Node.identifier, Node.parameterList]));

Node.simple_message = gen.map((args) => {
	return new L.AST.Message({identifier: args[0], plist: args[1]});
}, gen.array([Node.identifier, Node.parameterList]));

Node.simple_messageSend = gen.map((message) => {
	return new L.AST.MessageSend({message: message});
}, Node.parameterList);

Node.messageSend = gen.map((args) => {
	return new L.AST.MessageSend({receiver: args[0], message: args[1]});
}, gen.array([
	Node.identifier,
	Node.parameterList
]));


check.isomorphism = (description, nodeList) => {
	check.it(description, nodeList, (node) => {
		let parsed;
		[parsed, scopes] = L.Parser.parse(node.toString()).transform(L.Rules, scopes);
		parsed = parsed.transform((node) => {
			// Since the generative AST doesn't go through a scoping or
			// name binding step, we strip the scope and binding values from
			// the parsed AST before comparison.
			node = (node.has('binding')) ? node.set('binding', null) : node;
			return node.set('scope', null);
		});
		assert.equal(node, parsed.exprs.first());
	});
};

describe('Parser', parser_description);

