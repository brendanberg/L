/*
	AST Node Definitions
*/

module.exports = {
    Grouping: require('./ast/grouping'),
    InfixExpression: require('./ast/infixexpression'),
    PrefixExpression: require('./ast/prefixexpression'),
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
//  MessageSend: require('./ast/messagesend'),
    Identifier: require('./ast/identifier'),
    KeyValuePair: require('./ast/keyvaluepair'),
//  Record: require('./ast/record'),
//  Option: require('./ast/option'),
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
	// TODO: The invocation may be specific to method calls on types
	Invocation: I.Record(
		{target: _, plist: nilList, tags: _map}, 'Invocation'
	),
	Unify: I.Record(
		{lhs: _, rhs: _, tags: _map}, 'Unify'
	),
	Message: I.Record(
		{identifier: _, plist: _, tags: _map}, 'Message'
	),
	MessageSend: I.Record(
		{sender: _, receiver: _, message: _, tags: _map}, 'MessageSend'
	),
	Record: I.Record(
		{members: nilList, ctx: _, tags: _map}, 'Record'
	),
	Option: I.Record(
		{components: nilList, label: _, ctx: _, tags: _map}, 'Option'
	),
	Error: I.Record(
		{subject: _, message: _, consumed: _, encountered: nilList}, 'Error'
	),
};*/

