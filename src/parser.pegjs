{
	var I = require('immutable');
	var Skel = require('./skeleton');

	var L = {};
	let asString = function(val) { return val.toString(); };
	//var Cursor = I.Record({start: _, end: _});
}

/* Parsing the L Programming Language

	 The L Programming Language is parsed in three steps. First, the source code
	 is read into a tokenized syntax tree. Second, the tokenized tree is traversed
	 and expanded according to macro rules into an abstract syntax tree. Finally,
	 the AST ---

	 1. Read (build the term tree)

	 The read stage reads the source text and outputs a term tree. 
	 The read stage recognizes the generalized structure of the program:
	 delimited lists, literals, identifiers, and operators.

	 2. Match (macro-lookup)

	 3. Expand

 */

start
	= exprs:expressionList {
			return new Skel.Block({
				exprs: exprs,
				tags: I.Map({source: 'module'})
			});
		}

expressionList
	= __ first:expression rest:(_S e:expression { return e; })* _S? __ {
			return I.List([first].concat(rest));
		}


/*

	 The L Programming Language Skeleton Syntax

	 A program is a list of expressions. Since blocks are lists of expressions
	 with a context, parsing a source file returns a block containing the source
	 program's expressions.

	 At the skeleton tree level, expressions are lists of terms. Terms can be
	 either atomic or containers of other expressions.

	 Atomic terms are literals, identifiers, symbols, and operators.

	 Container terms are lists, messages, types and blocks.

 */

/*---------------------------------------------------------------------------
	Expressions
	--------------------------------------------------------------------------*/

expression
	= first:term rest:(_ t:term { return t; })* _ {
			return new Skel.Expression({
				terms: I.List([first].concat(rest))
			});
		}

term
	= identifier
	/ symbol
	/ list
	/ block
	// type
	/ op:Operator { return new Skel.Operator({label: op}); }
	/ number
	/ '"' v:(!'"' !'\n' ch:. { return ch; })* '"' {
			return new Skel.Text({value: v.join('')});
		}
	/ "'" v:(!"'" !'\n' ch:. { return ch; })* "'" {
			return new Skel.Text({value: v.join('')});
		}
	/*/ '(' e:expression ')' {
			return new Skel.Expression({
				terms: I.List([e]),
				tags: I.Map({enclosure: 'parentheses'})
			});
		}*/
	/ message


/*---------------------------------------------------------------------------
  Operators
 ---------------------------------------------------------------------------*/

Operator "operator"
	= "::"
	/ "..."
	/ ".."
	/ "->"
	/ "~>"
	/ "<~"
	/ "??"
	/ "//:"
	/ "/\\"
	/ "\\/"
	/ "\\"  // Prefix only: eager override
	/ "/:"
	/ "+:"
	/ "-:"
	/ "*:"
	/ "%:"
	/ "<="
	/ "=="
	/ "!="
	/ ">="
	/ "//"
	/ "@"
	/ "+"   // As prefix: arithmetic no-op
	/ "-"   // As prefix: arithmetic negation
	/ "!"   // Prefix only: logical not
	/ "*"
	/ "/"
	/ "%"
	/ "<"
	/ ">"
	/ "&"
	/ "|"
	/ "^"   // As prefix: [reserved for future use]
	/ "."
	/ ":"
	/ "~"   // Prefix only: [reserved for future use]


/*---------------------------------------------------------------------------
	Parenthesized List
 ---------------------------------------------------------------------------*/

// ( identifiers... )
message
	= '(' __ expList:expressionList ? __ ')' {
			return new Skel.Message({exprs: expList || I.List([])});
		}


/*---------------------------------------------------------------------------
	Braced List
 ----------------------------------------------------------------------------*/

// { exprs... }
block
	= '{' __ expList:expressionList ? __ '}' {
			return new Skel.Block({exprs: expList || I.List([])});
		}


/*---------------------------------------------------------------------------
	Square Bracketed List
 ----------------------------------------------------------------------------*/

// [ exprs... ]
list
	= '[' __ expList:expressionList ? __ ']' {
			return new Skel.List({exprs: expList || I.List([])});
		}


/*---------------------------------------------------------------------------
	Symbols and Identifiers
 ----------------------------------------------------------------------------*/

// $ identifier
symbol "symbol"
	= '$' l:label {
			return new Skel.Symbol({label: l});
		}

identifier "identifier"
	= l:label mod:postfixModifier? {
			return new Skel.Identifier({label: l, modifier: mod});
		}

label
	= first:[a-zA-Z_] rest:[a-zA-Z0-9_-]* { return first + rest.join(''); }

postfixModifier
	= '?' / '!'

/*

Symbol :: < Text label >
Symbol s (init) -> (Text label) -> {
  
Symbol s (evaluate: Context c) -> { c(getSymbol: s.label) }

Identifier :: < Text label >
Identifier id (evaluate: Context c) -> { c[id.label] }

y :: $y
items :: [Symbol('x'): 1, y: 2, $z: 3]

#- $y is a symbol literal.
 - Symbol('x') is the constructor form.
 - In the hashmap literal, y gets evaluated in the current context, and
 - resolves to $y. $z is the symbol literal, which evaluates to iteslf.
 -#
	 
Bool :: < True | False >
Bool.True
Bool.False

Option :: < Some(*) | Nothing >
b :: Option.Some(Bool.True)

 */


/*---------------------------------------------------------------------------
  Numeric Literals
 ---------------------------------------------------------------------------*/

number "number"
	= hex
	/ imaginary
	/ scientific
	/ decimal
	/ integer

integer
	= '0' { return new Skel.Integer({value: 0, tags: I.Map({'source_base': 10})}); }
	/ first:[1-9] rest:[0-9]* {
			var val = parseInt(first + rest.join(''), 10);
			return new Skel.Integer({value: val, tags: I.Map({'source_base': 10})});
		}

decimal
	= int:integer '.' digits:[0-9]* {
			var fraction = parseInt(digits.join(''), 10) || 0;
			var factor = Math.pow(10, digits.length);

			return new Skel.Decimal({
				numerator: int.value * factor + fraction,
				exponent: digits.length
			});
		}

scientific
	= sig:integer [eE] [+-]? mant:integer {
			return new Skel.Scientific({significand: sig, mantissa: mant});
		}
	/ sig:decimal [eE] [+-]? mant:integer {
			return new Skel.Scientific({significand: sig, mantissa: mant});
		}

hex
	= '0x0' {
			return new Skel.Integer({value: 0, tags: I.Map({'source_base': 16})});
		}
	/ '0x' first:[1-9a-fA-F] rest:[0-9a-fA-F]* {
			var val = parseInt(first + rest.join(''), 16);
			return new Skel.Integer({value: val, tags: I.Map({'source_base': 16})});
		}

imaginary
	= num:(scientific / hex / decimal / integer) [ijJ] {
			return new Skel.Complex({imaginary: num});
		}


/*---------------------------------------------------------------------------
  Convenience Shorthand for Whitespaces and Separators
 ---------------------------------------------------------------------------*/

_ "whitespace"
  = (Whitespace / Comment)*

__ "whitespace"
	= (Linespace / Comment)*

_S "separator"
	= _ [,\n] __


/*---------------------------------------------------------------------------
  Whitespace and Comment Definitions
 ---------------------------------------------------------------------------*/

Whitespace
	= [ \t]+

Linespace
	= [ \t\n]+

Comment "comment"
	= '#' t:(!'\n' .)* '\n' {
			return Skel.Comment({text: t.join(''), tags: I.Map({source: 'trailing'})});
		}
	/ '#-' t:(!'-#' .)* '-#' {
			return Skel.Comment({text: t.join(''), tags: I.Map({source: 'inline'})});
		}

