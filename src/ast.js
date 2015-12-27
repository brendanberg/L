var I = require("immutable");
var _ = null;

var _map = I.Map({});
var _list = I.List([]);

var Cursor = I.Record({start: null, end: null});

var AST = {
	MatchExpression: I.Record(
		{lhs: _, rhs: _, tags: _map}, 'MatchExpression'
	),
	InfixExpression: I.Record(
		{op: _, lhs: _, rhs: _, tags: _map}, 'InfixExpression'
	),
	PrefixExpression: I.Record(
		{op: _, exp: _, tags: _map}, 'PrefixExpression'
	),
	Function: I.Record(
		{plist: _list, block: _, ctx: _, tags: _map}, 'Function'
	),
	Match: I.Record(
		{kvlist: _list, predicates: _list, ctx: _, tags: _map}, 'Match'
	),
	Method: I.Record(
		{typeId: _, plist: _list, block: _, ctx: _, tags: _map}, 'Method'
	),
	Invocation: I.Record(
		{target: _, plist: _list, tags: _map}, 'Invocation'
	),
	Block: I.Record(
		{explist: _list, tags: _map}, 'Block'
	),
	List: I.Record(
		{list: _list, tags: _map}, 'List'
	),
	Dictionary: I.Record(
		{kvlist: _list, ctx: _, tags: _map}, 'Dictionary'
	),
	Assignment: I.Record(
		{identifier: _, value: _, tags: _map}, 'Assignment'
	),
	Lookup: I.Record(
		{target: _, term: _, tags: _map}, 'Lookup'
	),
	Message: I.Record(
		{identifier: _, plist: _, tags: _map}, 'Message'
	),
	MessageSend: I.Record(
		{sender: _, receiver: _, message: _, tags: _map}, 'MessageSend'
	),
	IdentifierList: I.Record(
		{list: _list, tags: _map}, 'IdentifierList'
	),
	Identifier: I.Record(
		{name: _, tags: _map}, 'Identifier'
	),
	ExpressionList: I.Record(
		{list: _list, tags: _map}, 'ExpressionList'
	),
	KeyValuePair: I.Record(
		{key: _, val: _, tags: _map}, 'KeyValuePair'
	),
	Struct: I.Record(
		{members: _list, name: _, tags: _map}, 'Struct'
	),
	Option: I.Record(
		{variants: _list, name: _, ctx: _, tags: _map}, 'Option'
	),
	Tag: I.Record(
		{name: _, value: _, ctx: _, tags: _map}, 'Tag'
	),
	Value: I.Record(
		{mommy: _, values: _list, ctx: _, tags: _map}, 'Value'
	),

	// String Type
	String: I.Record({value: _, tags: _map}, 'String'),

	// Numeric Types
	Integer: I.Record({value: _, tags: _map}, 'Integer'),
	Rational: I.Record({numerator: _, denominator: _, tags: _map}, 'Rational'),
	Decimal: I.Record({numerator: _, exponent: _, tags: _map}, 'Decimal'),
	Scientific: I.Record({significand: _, mantissa: _, tags: _map}, 'Scientific'),
	Complex: I.Record({real: _, imaginary: _, tags: _map}, 'Complex'),
	Bottom: I.Record({tags: _map}, 'Bottom'),
	Real: I.Record({magnitude: _, tags: _map}, 'Real')
};

module.exports = AST;
