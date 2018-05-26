{
	const { Map, List } = require('immutable');
	const punycode = require('punycode');
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

	 Container terms are lists, messages, types, and blocks.

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
	/ type_variable
	/ symbol
	/ angle_container // type
	/ brack_container // list
    / paren_container // message
	/ brace_container // block
	/ number
	/ "'" t:single_quote_string* "'" {
			let chars = punycode.ucs2.decode(t.join(''));
			return new AST.Text({value: chars});
		}
	/ '"' t:double_quote_string* '"' {
			let chars = punycode.ucs2.decode(t.join(''));
			return new AST.Text({value: chars});
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
	/ "=>"
	/ "<~"
	/ "|>"
	/ "<|"
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
	/ "!"   // As prefix: logical not; as infix: message send
	/ "**"
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
	/ "?"   // Not legal as infix or prefix operator. Used in guard expressions only.


/*---------------------------------------------------------------------------
  Parenthesized List   ( exprs... )
 ---------------------------------------------------------------------------*/

paren_container
	= '(' __ exp:nullaryLabel __ ')' {
			return new Skel.Message({
				exprs: List([new Skel.Expression({terms: List([exp])})]),
				tags: Map({envelopeShape: '()', specialForm: true})
			});
		}
    / '(' __ exp:expression __ ')' {
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
  Braced List   { exprs... }
 ----------------------------------------------------------------------------*/

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
  Square Bracketed List   [ exprs... ]
 ----------------------------------------------------------------------------*/

brack_container
	= '[' __ expList:expressionList ? __ ']' {
			return new Skel.List({
				exprs: expList || List([]),
				tags: Map({envelopeShape: '[]'})
			});
		}


/*---------------------------------------------------------------------------
  Angle Bracketed List   << exprs... >>
 ---------------------------------------------------------------------------*/

angle_container
	= '<<' __ expList:expressionList ? __ '>>' {
			return new Skel.Type({
				exprs: expList || List([]),
				tags: Map({envelopeShape: '<<>>'})
			});
		}


/*---------------------------------------------------------------------------
	Tags, Symbols, and Identifiers
 ----------------------------------------------------------------------------*/

// . label
symbol "symbol"
	= '.' l:labelChar+ {
			return new AST.Symbol({label: l.join('')});
		}

// TODO: AAAAUGHHH A NASTY HACK TO ALLOW (label.) SELECTORS
nullaryLabel "symbol"
	= l:labelChar+ '.' {
			return new AST.Symbol({label: l.join(''), tags: Map({nullary: true})})
		}

// $ label
type_variable "type variable"
	= '$' l:labelChar+ {
			return new AST.TypeVar({label: l.join('')});
		}

identifier "identifier"
	= l:label mod:postfixModifier? {
			return new AST.Identifier({label: l, modifier: mod});
		}

postfixModifier
	= '?' / '!'

label
	= first:labelStart rest:labelChar* { return first + rest.join(''); }

labelStart
	= [a-zA-Z_]
	/ [\u00A8\u00AA\u00AD\u00AF\u00B2-\u00B5\u00B7-\u00BA]
	/ [\u00BC-\u00BE\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF]
	/ [\u0100-\u02FF\u0370-\u167F\u1681-\u180D\u180F-\u1DBF\u1E00-\u1FFF]
	/ [\u200B-\u200D\u202A-\u202E\u203F-\u2040\u2054\u2060-\u206F]
	/ [\u2070-\u20CF\u2100-\u218F\u2460-\u24FF\u2776-\u2793\u2C00-\u2DFF\u2E80-\u2FFF]
	/ [\u3004-\u3007\u3021-\u302F\u3031-\u303F\u3040-\uD7FF]
	/ [\uF900-\uFD3D\uFD40-\uFDCF\uFDF0-\uFE1F\uFE30-\uFE44\uFE47-\uFFFD]
	/ h:[\uD800-\uDBFF] l:[\uDC00-\uDFFF] { return h + l; }
	// [\u{10000}-\u{1FFFD}\u{20000}-\u{2FFFD}\u{30000}-\u{3FFFD}\u{40000}-\u{4FFFD}]
	// [\u{50000}–\u{5FFFD}\u{60000}–\u{6FFFD}\u{70000}–\u{7FFFD}\u{80000}–\u{8FFFD}]
	// [\u{90000}–\u{9FFFD}\u{A0000}–\u{AFFFD}\u{B0000}–\u{BFFFD}\u{C0000}–\u{CFFFD}]
	// [\u{D0000}–\u{DFFFD}\u{E0000}–\u{EFFFD}]

labelChar
	= labelStart
	/ [0-9\u0300-\u036F\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F-]

/*

Symbol :: << Text label >>
Symbol s (init) -> (Text label) -> {

Symbol s (evaluate: Context c) -> { c(getSymbol: s.label) }

Identifier :: << Text label >>
Identifier id (evaluate: Context c) -> { c[id.label] }

y :: .y
items :: [Symbol('x'): 1, y: 2, .z: 3]

#- .y is a symbol literal.
 - Symbol('x') is the constructor form.
 - In the hashmap literal, y gets evaluated in the current context, and
 - resolves to .y. .z is the symbol literal, which evaluates to iteslf.
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
	= int:integer '.' !'.' digits:[0-9]* {
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
	= '0x' pad:'0'* first:[1-9a-fA-F] rest:[0-9a-fA-F]* {
			var val = parseInt(first + rest.join(''), 16);
			return new AST.Integer({value: val, tags: Map({'source_base': 16})});
		}
	/ '0x0' {
			return new AST.Integer({value: 0, tags: Map({'source_base': 16})});
		}

imaginary
	= num:(scientific / hex / decimal / integer) [ijJ] {
			let zero = AST.Integer({value: 0, tags: Map({'source_base': 10})});
			return new AST.Complex({real: zero, imaginary: num});
		}


/*---------------------------------------------------------------------------
  Text Literals
 ---------------------------------------------------------------------------*/

single_quote_string "text"
  = !("'" / "\\" / "\n") char:. { return char; }
  / "\\" seq:escape_sequence { return seq; }

double_quote_string "text"
  = !('"' / "\\" / "\n") char:. { return char; }
  / "\\" seq:escape_sequence { return seq; }

escape_sequence
  = "'"
  / '"'
  / '\\'
  / 'a'  { return "\x07"; }  // bell
  / 'b'  { return "\b"; }    // backspace
  / 'f'  { return "\f"; }    // form feed
  / 'n'  { return "\n"; }    // line feed
  / 'r'  { return "\r"; }    // carriage return
  / 't'  { return "\t"; }    // horizontal tab
  / 'v'  { return "\x0B"; }  // vertical tab
  / 'u{' ch:codepoint '}' { return ch; }

codepoint "codepoint"
	= ch:( X X X X X X X X / X X X X X X X / X X X X X X / X X X X X
			/ X X X X / X X X / X X / X ) {
		return String.fromCodePoint(parseInt(ch.join(''), 16));
	}

X "hex"
	= ch:[0-9a-fA-F]


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
	= '#-' t:(!'-#' .)* '-#' {
			return Skel.Comment({text: t.join(''), tags: Map({source: 'inline'})});
		}
	/ '#' t:(!'\n' .)* '\n' {
			return Skel.Comment({text: t.join(''), tags: Map({source: 'trailing'})});
		}

