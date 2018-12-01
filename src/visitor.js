/* Template for AST Visitor Functions
   ----------------------------------
   This file should not be imported directly; it should be copied and modified
   to perform the desired operation on a given AST.

   The matching code will use a default noop function if a rule for a
   particular node type is not defined.
 */
let visitor = function(tree) {
	let match = {
		'Bind': function (node) { return node; },
		'RecordType': function (node) { return node; },
		'UnionType': function (node) { return node; },
		'Method': function (node) { return node; },

		'MessageSend': function (node) { return node; },
		'Call': function (node) { return node; },
		'SymbolLookup': function (node) { return node; },
		'SequenceAccess': function (node) { return node; },
		'Immediate': function (node) { return node; },

		'PrefixExpression': function (node) { return node; },
		'InfixExpression': function (node) { return node; },

		'Block': function (node) { return node; },
		'HybridFunction': function (node) { return node; },
		'Function': function (node) { return node; },
		'List': function (node) { return node; },
		'Map': function (node) { return node; },
		'KeyValuePair': function (node) { return node; },

		'Operator': function (node) { return node; },
		'Identifier': function (node) { return node; },
		'Symbol': function (node) { return node; },
		'TypeVar': function (node) { return node; },

		'Record': function (node) { return node; },
		'Tuple': function (node) { return node; },
		'Text': function (node) { return node; },

		'Integer': function (node) { return node; },
		'Rational': function (node) { return node; },
		'Decimal': function (node) { return node; },
		'Scientific': function (node) { return node; },
		'Complex': function (node) { return node; },

		'Bottom': function (node) { return node; },
	};

	if (match.hasOwnProperty(tree._name) {
		return match[tree._name](tree);
	} else {
		return tree;
	}
};

