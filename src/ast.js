


module.exports = {
	Bind: require('./ast/bind'),
	RecordType: require('./ast/recordtype'),
	UnionType: require('./ast/uniontype'),
	Method: require('./ast/method'),

	MessageSend: require('./ast/messagesend'),
	Call: require('./ast/call'),
	SymbolLookup: require('./ast/symbollookup'),
	SequenceAccess: require('./ast/sequenceaccess'),
	Immediate: require('./ast/immediate'),

	PrefixExpression: require('./ast/prefixexpression'),
	InfixExpression: require('./ast/infixexpression'),

	Block: require('./ast/block'),
	HybridFunction: require('./ast/hybridfunction'),
	Function: require('./ast/function'),
	List: require('./ast/list'),
	Map: require('./ast/map'),
	KeyValuePair: require('./ast/keyvaluepair'),

	//Message: require('./ast/message'), // !!!
	Operator: require('./ast/operator'), // Eventually, we should move operator to skeleton
	Identifier: require('./ast/identifier'),
	Symbol: require('./ast/symbol'),
	TypeVar: require('./ast/typevar'),

	Record: require('./ast/record'),
	Tuple: require('./ast/tuple'),
	Text: require('./ast/text'),
	// TODO Channel: require('./ast/channel'),

	Integer: require('./ast/integer'),
	Rational: require('./ast/rational'),
	Decimal: require('./ast/decimal'),
	Scientific: require('./ast/scientific'),
	Complex: require('./ast/complex'),

	Bottom: require('./ast/bottom'),

	Error: require('./ast/error'),
};
