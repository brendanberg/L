{
	const { Map, List } = require('immutable');
	const { AST, Skel } = require('./l')
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
				tags: Map({source: 'module', 'envelopeShape': '{}'})
			});
		}

expressionList
	= __ first:expression rest:(_S e:expression { return e; })* _S? __ {
			return List([first].concat(rest));
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
				terms: List([first].concat(rest))
			});
		}

term
	= identifier
	/ symbol
	/ qualifier
	/ angle_container // type
	/ brack_container // list
    / paren_container // message
	/ brace_container // block
	/ number
	/ '"' v:(!'"' !'\n' ch:. { return ch; })* '"' {
            let value = v.join('').replace(/\\[tn\\]/g, function(match) {
                return ({
                    "\\n": "\n",
                    "\\t": "\t",
                    "\\\\": "\\"
                })[match];
            });
			return new AST.Text({value: value});
		}
	/ "'" v:(!"'" !'\n' ch:. { return ch; })* "'" {
            let value = v.join('').replace(/\\[tn\\]/g, function(match) {
                return ({
                    "\\n": "\n",
                    "\\t": "\t",
                    "\\\\": "\\"
                })[match];
            });
			return new AST.Text({value: value});
		}
	/ op:operator { return new AST.Operator({label: op}); }


/*---------------------------------------------------------------------------
  Operators
 ---------------------------------------------------------------------------*/

operator "operator"
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
	/ "<" !"<" { return '<'; }
	/ ">" !">" { return '>'; }
    / "<*"
    / "*>"
	/ "&"
	/ "|"
	/ "^"   // As prefix: [reserved for future use]
	/ ":"
	/ "~"   // Prefix only: [reserved for future use]


/*---------------------------------------------------------------------------
	Parenthesized List
 ---------------------------------------------------------------------------*/

// ( exprs... )
paren_container
    = '(' __ exp:expression __ ')' {
			return new Skel.Message({
				exprs: List([exp]),
				tags: Map({envelopeShape: '()', specialForm: true})
			});
		}
	/ '(' __ expList:expressionList ? __ ')' {
			return new Skel.Message({
				exprs: expList || List([]),
				tags: Map({envelopeShape: '()'})
			});
		}


/*---------------------------------------------------------------------------
	Braced List
 ----------------------------------------------------------------------------*/

// { exprs... }
brace_container
	= '{{' __ expList:expressionList ? __ '}}' {
			return new Skel.Block({
				exprs: expList || List([]),
				tags: Map({envelopeShape: '{{}}'})
			});
		}
	/ '{' __ expList:expressionList ? __ '}' {
			return new Skel.Block({
				exprs: expList || List([]),
				tags: Map({envelopeShape: '{}'})
			});
		}

/*---------------------------------------------------------------------------
	Square Bracketed List
 ----------------------------------------------------------------------------*/

// [ exprs... ]
brack_container
	= '[' __ expList:expressionList ? __ ']' {
			return new Skel.List({
				exprs: expList || List([]),
				tags: Map({envelopeShape: '[]'})
			});
		}

/*---------------------------------------------------------------------------
  Angle Bracketed List
 ---------------------------------------------------------------------------*/

angle_container
	= '<<' __ expList:expressionList ? __ '>>' {
			return new Skel.Type({
				exprs: expList || List([]),
				tags: Map({envelopeShape: '<<>>'})
			});
		}

/*---------------------------------------------------------------------------
	Qualifiers, Symbols, and Identifiers
 ----------------------------------------------------------------------------*/

// . label
qualifier "qualifier"
	= '.' l:label {
			return new AST.Qualifier({label: l});
		}

// $ label
symbol "symbol"
	= '$' l:label {
			return new AST.Symbol({label: l});
		}

identifier "identifier"
	= l:label mod:postfixModifier? {
			return new AST.Identifier({label: l, modifier: mod});
		}

label
	= first:[a-zA-Z_] rest:[a-zA-Z0-9_-]* { return first + rest.join(''); }

postfixModifier
	= '?' / '!'

/*

Symbol :: << Text label >>
Symbol s (init) -> (Text label) -> {

Symbol s (evaluate: Context c) -> { c(getSymbol: s.label) }

Identifier :: << Text label >>
Identifier id (evaluate: Context c) -> { c[id.label] }

y :: $y
items :: [Symbol('x'): 1, y: 2, $z: 3]

#- $y is a symbol literal.
 - Symbol('x') is the constructor form.
 - In the hashmap literal, y gets evaluated in the current context, and
 - resolves to $y. $z is the symbol literal, which evaluates to iteslf.
 -#

Bool :: << True | False >>
Bool.True
Bool.False

Option :: << Some(*) | Nothing >>
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
	= '0' { return new AST.Integer({value: 0, tags: Map({'source_base': 10})}); }
	/ first:[1-9] rest:[0-9]* {
			var val = parseInt(first + rest.join(''), 10);
			return new AST.Integer({value: val, tags: Map({'source_base': 10})});
		}

decimal
	= int:integer '.' digits:[0-9]* {
			var fraction = parseInt(digits.join(''), 10) || 0;
			var factor = Math.pow(10, digits.length);

			return new AST.Decimal({
				numerator: int.value * factor + fraction,
				exponent: digits.length
			});
		}

scientific
	= sig:integer [eE] [+-]? mant:integer {
			return new AST.Scientific({significand: sig, mantissa: mant});
		}
	/ sig:decimal [eE] [+-]? mant:integer {
			return new AST.Scientific({significand: sig, mantissa: mant});
		}

hex
	= '0x0' {
			return new AST.Integer({value: 0, tags: Map({'source_base': 16})});
		}
	/ '0x' first:[1-9a-fA-F] rest:[0-9a-fA-F]* {
			var val = parseInt(first + rest.join(''), 16);
			return new AST.Integer({value: val, tags: Map({'source_base': 16})});
		}

imaginary
	= num:(scientific / hex / decimal / integer) [ijJ] {
			return new AST.Complex({imaginary: num});
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
			return Skel.Comment({text: t.join(''), tags: Map({source: 'trailing'})});
		}
	/ '#-' t:(!'-#' .)* '-#' {
			return Skel.Comment({text: t.join(''), tags: Map({source: 'inline'})});
		}

