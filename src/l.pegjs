
start
	= expressionList

expressionList
	= first:expression rest:($ _ exp:expression { return exp; } )* $ ? _ {
			if (rest.length > 0) {
				return new L.AST.ExpressionList([first].concat(rest));
			} else {
				return first;
			}
		}

expression
	= e1:expressionNoInfix infix:(_ op:infixOperator _ e2:expression {
			return {"op": op, "e2": e2};
		}) ? {
			if (infix) {
				return new L.AST.InfixExpression(infix['op'], e1, infix['e2']);
			} else {
				return e1;
			}
		}

expressionNoAssign
	= e1:expressionNoInfix infix:(_ op:infixOperatorNoAssign _ e2:expression {
			return {'op': op, 'e2': e2};
		}) ? {
			if (infix) {
				return new L.AST.InfixExpression(infix['op'], e1, infix['e2']);
			} else {
				return e1;
			}
		}

expressionNoInfix
	= function
	/ prefixExpression
	/ messageSend
	/ list
	/ dictionary
	/ identifier
	/ blockQuote
	/ quote
	/ string
	/ number

messageSend
	= id:identifier _ kvl:keyValueList
	/ id:identifier _ id:identifier
	// dict or id?

prefixExpression
	= op:prefixOperator _ e:expression {
			return new L.AST.PrefixExpression(op, e);
		}

infixOperator
	= ":" { return new L.AST.InfixOperator(':'); }
	/ infixOperatorNoAssign

infixOperatorNoAssign
	= "//:" { return new L.AST.InfixOperator('//:'); }
	/ "//" { return new L.AST.InfixOperator('//'); }
	/ "/:" { return new L.AST.InfixOperator('/:'); }
	/ "+:" { return new L.AST.InfixOperator('+:'); }
	/ "-:" { return new L.AST.InfixOperator('-:'); }
	/ "*:" { return new L.AST.InfixOperator('*:'); }
	/ "%:" { return new L.AST.InfixOperator('%:'); }
	/ "<=" { return new L.AST.InfixOperator('<='); }
	/ "==" { return new L.AST.InfixOperator('=='); }
	/ "!=" { return new L.AST.InfixOperator('!='); }
	/ ">=" { return new L.AST.InfixOperator('>='); }
	/ "->" { return new L.AST.InfixOperator('->'); }
	/ "<-" { return new L.AST.InfixOperator('<-'); }
	/ ".." { return new L.AST.InfixOperator('..'); }
	/ "~>" { return new L.AST.InfixOperator('~>'); }
	/ "<~" { return new L.AST.InfixOperator('<~'); }
	/ "+" { return new L.AST.InfixOperator('+'); }
	/ "-" { return new L.AST.InfixOperator('-'); }
	/ "*" { return new L.AST.InfixOperator('*'); }
	/ "/" { return new L.AST.InfixOperator('/'); }
	/ "%" { return new L.AST.InfixOperator('%'); }
	/ "<" { return new L.AST.InfixOperator('<'); }
	/ ">" { return new L.AST.InfixOperator('>'); }
	/ "&" { return new L.AST.InfixOperator('&'); }
	/ "|" { return new L.AST.InfixOperator('|'); }
	/ "^" { return new L.AST.InfixOperator('^'); }

prefixOperator
	= "+" { return new L.AST.PrefixOperator('+'); }
	/ "-" { return new L.AST.PrefixOperator('-'); }
	/ "~" { return new L.AST.PrefixOperator('~'); }
	/ "!" { return new L.AST.PrefixOperator('!'); }
	/ "=" { return new L.AST.PrefixOperator('='); }
	/ "\" { return new L.AST.PrefixOperator('\'); }
	/ "^" { return new L.AST.PrefixOperator('^'); }


function
	= il:identifierList _ "->" _ b:block { return new L.AST.Function(il, b); }
	/ il:identifierList _ "=>" _ b:block { return new L.AST.Function(il, b); }

block
	= "[\n" exps:expressionList "\n" ? "]" { return new L.AST.Block(exps); }

identifierList
	// "[" _ ( identifier ($ _ identifier )* $? )? _ "]"
	= "[" _ idl:(first:identifier rest:($ _ id:identifier { return id; })* $ ? {
			return new L.AST.IdentifierList([first].concat(rest));
		}) ? _ "]" {
			return idl || new L.AST.IdentifierList([]);
		}

list
	= "[" _ el:expressionList ? _ "]" {
			if (!el) {
				return new L.AST.List([]);
			} else {
				return new L.AST.List(el.list);
			}
		}

dictionary
	= "{" _ kvl:keyValueList ? _ "}" { return kvl || new L.AST.KeyValueList([]); }

keyValueList
	= first:keyValuePair rest:($ _ kvp:keyValuePair { return kvp; })* $ ? _ {
			return new L.AST.KeyValueList([first].concat(rest));
		}

keyValuePair
	= key:expressionNoAssign _ ":" _ val:expression {
			return new L.AST.KeyValuePair(key, val);
		}

identifier
	= n:name mod:postfixModifier? {
			n.modifier = mod;
			return n;
		}

name
	= first:[a-zA-Z_] rest:[a-zA-Z0-9_-]* {
			return new L.AST.Identifier(first + rest.join(''));
		}

postfixModifier
	= "?" { return new L.AST.PostfixModifier('?'); }
	/ "!" { return new L.AST.PostfixModifierr('!'); }

quote
	= "|" _ exp:expression _ "|" { return new L.AST.Quote(exp); }

blockQuote
	= "||" __ el:expressionList ? __ "||" {
			if (el.type !== 'ExpressionList') {
				return new L.AST.Quote(new L.AST.ExpressionList([el]));
			} else {
				return new L.AST.Quote(el);
			}
		}

string
	// potentially disallow new lines, control chars, etc.
	= "\"" str:[^"]* "\"" { return new L.AST.String(str.join('')); }
	/ "'" str:[^']* "'" { return new L.AST.String(str.join('')); }

number
	= imaginary
	/ scientific
	/ hex
	/ decimal
	/ integer

integer
	= "0" { return new L.AST.Integer(0); }
	/ first:[1-9] rest:[0-9]* {
			var val = parseInt(first + rest.join(''), 10);
			return new L.AST.Integer(val);
		}

decimal
	= int:integer "." digits:[0-9]+ {
			var fractionPart = parseInt(digits.join(''), 10),
					exponent = fractionPart ? digits.length : 0;
			return new L.AST.Decimal(int.value * Math.pow(10, exponent) + fractionPart, exponent);
		}

imaginary
	= int:integer [ijJ] { return new L.AST.Imaginary(int); }
	/ dec:decimal [ijJ] { return new L.AST.Imaginary(dec); }


scientific
	= sig:integer [eE] [+-]? mant:integer { return new L.AST.Real(); }
	/ sig:decimal [eE] [+-]? mant:integer { return new L.AST.Real(); }

hex
	= "0x0" { return new L.AST.Integer(0); }
	/ "0x" first:[1-9a-fA-F] rest:[0-9a-fA-F]* {
			return new L.AST.Integer(parseInt(first + rest.join(''), 16));
		}

_
	= (" " / "\t")*

__
	= (" " / "\t" / "\n")*

$
	= ("," / "\n" / ",\n")
