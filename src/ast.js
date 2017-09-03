let I = require("immutable");
const _ = null;

const nilMap = I.Map({});
const nilList = I.List([]);

let Cursor = I.Record({start: _, end: _});

let AST = {
	MatchExpression: I.Record(
		{lhs: _, rhs: _, tags: nilMap}, 'MatchExpression'
	),
	InfixExpression: I.Record(
		{op: _, lhs: _, rhs: _, tags: nilMap}, 'InfixExpression'
	),
	PrefixExpression: I.Record(
		{op: _, exp: _, tags: nilMap}, 'PrefixExpression'
	),
	Function: I.Record(
		{template: _, plist: nilList, block: _, ctx: _, tags: nilMap}, 'Function'
	),
	FunctionCall: I.Record(
		{plist: nilList, target: _, tags: nilMap}, 'FunctionCall'
	),
	IdentifierList: I.Record(
		{idents: nilList}, 'IdentifierList'
	),
	ParameterList: I.Record(
		{exprs: nilList}, 'ParameterList'
	),
	// TODO: Rename this to 'GroupedExpression' or 'ParenthesizedForm' ?
	Parenthesized: I.Record(
		{expr: _}, 'Parenthesized'
	),
	Match: I.Record(
		{predicates: nilList, ctx: _, tags: nilMap}, 'Match'
	),
	Method: I.Record(
		{type: _, target: _, selector: nilList, block: _, ctx: _, tags: nilMap}, 'Method'
	),
	Invocation: I.Record(
		{target: _, plist: nilList, tags: nilMap}, 'Invocation'
	),
	Evaluate: I.Record(
		{target: _, tags: nilMap}, 'Evaluate'
	),
	Block: I.Record(
		{exprs: nilList, ctx: _, tags: nilMap}, 'Block'
	),
	List: I.Record(
		{items: nilList, tags: nilMap}, 'List'
	),
	Map: I.Record(
		{items: nilList, ctx: _, tags: nilMap}, 'Map'
	),
	Assignment: I.Record(
		{template: _, value: _, tags: nilMap}, 'Assignment'
	),
	Template: I.Record(
		{match: _, tags: nilMap}, 'Template'
	),
	ListAccess: I.Record(
		{target: _, terms: nilList, tags: nilMap}, 'ListAccess'
	),
	PropertyLookup: I.Record(
		{target: _, term: _, tags: nilMap}, 'PropertyLookup'
	),
	Unify: I.Record(
		{lhs: _, rhs: _, tags: nilMap}, 'Unify'
	),
	Message: I.Record(
		{identifier: _, plist: _, tags: nilMap}, 'Message'
	),
	MessageSend: I.Record(
		{sender: _, receiver: _, message: _, tags: nilMap}, 'MessageSend'
	),
	Identifier: I.Record(
		{label: _, modifier: _, tags: nilMap}, 'Identifier'
	),
	KeyValuePair: I.Record(
		{key: _, val: _, tags: nilMap}, 'KeyValuePair'
	),
	Record: I.Record(
		{members: nilList, label: _, tags: nilMap}, 'Record'
	),
	Member: I.Record(
		{label: _, type: _}, 'Member'
	),
	Option: I.Record(
		{components: nilList, label: _, ctx: _, tags: nilMap}, 'Option'
	),
	Symbol: I.Record(
		//TODO: What are `types` and `ctx` for here?
		{label: _, types: nilList, ctx: _, tags: nilMap}, 'Symbol'
	),
	Error: I.Record(
		{subject: _, message: _, consumed: _, encountered: nilList}, 'Error'
	),

	// Text Type
	Text: I.Record({value: _, tags: nilMap}, 'Text'),

	// Numeric Types
	Integer: I.Record({value: _, tags: nilMap}, 'Integer'),
	Rational: I.Record({numerator: _, denominator: _, tags: nilMap}, 'Rational'),
	Decimal: I.Record({numerator: _, exponent: _, tags: nilMap}, 'Decimal'),
	Scientific: I.Record({significand: _, mantissa: _, tags: nilMap}, 'Scientific'),
	Complex: I.Record({real: _, imaginary: _, tags: nilMap}, 'Complex'),
	Bottom: I.Record({tags: nilMap}, 'Bottom'),
	Real: I.Record({magnitude: _, tags: nilMap}, 'Real')
};

module.exports = AST;
