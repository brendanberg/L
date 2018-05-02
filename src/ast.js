/*
	AST Node Definitions
*/

module.exports = {
    Grouping: require('./ast/grouping'),
    InfixExpression: require('./ast/infixexpression'),
    PrefixExpression: require('./ast/prefixexpression'),
	Operator: require('./ast/operator'),
    Function: require('./ast/function'),
    FunctionCall: require('./ast/functioncall'),
	IdentifierList: require('./ast/identifierlist'),
    Match: require('./ast/match'),
	Method: require('./ast/method'),
    Invocation: require('./ast/invocation'),
	Evaluate: require('./ast/evaluate'),
    Block: require('./ast/block'),
    List: require('./ast/list'),
//* Type: require('./ast/type'), //TODO????? ALSO UPDATE SKEL NODE?
    Map: require('./ast/map'),
    Assignment: require('./ast/assignment'),
    Template: require('./ast/template'),
	Accessor: require('./ast/accessor'),
	Lookup: require('./ast/lookup'),
//  Unify: require('./ast/unify'),
//* Message: require('./ast/message'),
	MessageSend: require('./ast/messagesend'),
    Identifier: require('./ast/identifier'),
    KeyValuePair: require('./ast/keyvaluepair'),
	Record: require('./ast/record'),
	Tag: require('./ast/tag'),
	Union: require('./ast/union'),
	Variant: require('./ast/variant'),
    Symbol: require('./ast/symbol'),
	Error: require('./ast/error'),
    Text: require('./ast/text'),
	Integer: require('./ast/integer'),
	Rational: require('./ast/rational'),
	Decimal: require('./ast/decimal'),
	Scientific: require('./ast/scientific'),
	Complex: require('./ast/complex'),
    Bottom: require('./ast/bottom'),
//  Real: require('./ast/real'),
//	Real: I.Record({magnitude: _, tags: _map}, 'Real')
};

/*
let AST = {
	Unify: I.Record(
		{lhs: _, rhs: _, tags: _map}, 'Unify'
	),
	Message: I.Record(
		{identifier: _, plist: _, tags: _map}, 'Message'
	),
};*/

