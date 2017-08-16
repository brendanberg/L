var I = require('immutable');

var _ = null;
var nilMap = I.Map({});
var nilList = I.List([]);

var Skel = {
	// Context Nodes
	Block: I.Record({exprs: nilList, tags: nilMap}, 'Block'),

	// Container Nodes
	List: I.Record({exprs: nilList, tags: nilMap}, 'List'),
	Message: I.Record({exprs: nilList, tags: nilMap}, 'Message'),
	Type: I.Record({tags: nilMap}, 'Type'),

	// Expression Node
	Expression: I.Record({terms: nilList, tags: nilMap}, 'Expression'),

	// Symbol Nodes
	Operator: I.Record({label: _, tags: nilMap}, 'Operator'),
	Symbol: I.Record({label: _, tags: nilMap}, 'Symbol'),
	Identifier: I.Record({label: _, modifier: _, tags: nilMap}, 'Identifier'),

	// Literal value nodes
	Text: I.Record({value: _, tags: nilMap}, 'Text'),
	Integer: I.Record({value: _, tags: nilMap}, 'Integer'),
	Decimal: I.Record({numerator: _, exponent: _, tags: nilMap}, 'Decimal'),
	Scientific: I.Record({significand: _, mantissa: _, tags: nilMap}, 'Scientific'),
	Complex: I.Record({real: _, imaginary: _, tags: nilMap}, 'Complex'),
	
	Comment: I.Record({text: _, tags: nilMap}, 'Comment'),
};

module.exports = Skel;
