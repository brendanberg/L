
start
	= expressionList

expressionList
	= first:expression rest:($ _ exp:expression { return exp; } )* $? _ {
			if (rest.length > 0) {
				return new L.AST.ExpressionList([first].concat(rest));
			} else {
				return first;
			}
		}

pureExpressionList
	= first:pureExpression rest:($ _ exp:pureExpression { return exp; } )* $? _ {
			if (rest.length > 0) {
				return new L.AST.ExpressionList([first].concat(rest));
			} else {
				return first;
			}
		}

expression
	= e1:pureExpression _ ':' _ e2:pureExpression {
			var op = new L.AST.InfixOperator(':');
			return new L.AST.InfixExpression(op, e1, e2);
		}
	/ e1:pureExpression _ '<-' _ e2:pureExpression {
			return new L.AST.MessageSend(null, e1, e2);
		}
	/ pureExpression

// Purely functional expression
pureExpression
	= e1:expressionNoInfix infix:(_ op:infixOperator _ e2:expression {
			return {"op": op, "e2": e2};
		}) ? {
			if (infix) {
				return new L.AST.InfixExpression(infix['op'], e1, infix['e2']);
			} else {
				return e1;
			}
		}


expressionNoInfix
	= val:value lst:list {
			return new L.AST.Lookup(val, lst);
		}
	/ val:value dct:dictionary {
			return new L.AST.Lookup(val, dct);
		}
	/ val:value plist:parameterList {
			return new L.AST.Invocation(val, plist);
		}
	/ prefixExpression
	/ value

message
	= id:identifier params:parameterList? { return new L.AST.Message(id, params); }

parameterList
	= _ '(' __ first:(keyValuePair / pureExpression) rest:(
			$ _ item:(keyValuePair / pureExpression) { return item; }
		)* $? __ ')' {
			return new L.AST.List([first].concat(rest), {source: 'parameterList'});
		}
	/ _ '(' __ ')' { return new L.AST.List([], {source: 'parameterList'}); }
	
prefixExpression
	= op:prefixOperator _ e:value {
			return new L.AST.PrefixExpression(op, e);
		}

value
	= function
	/ list
	/ dictionary
	/ identifier
	/ string
	/ number
	/ block
	/ '(' e:expression ')' { return e; }

infixOperator
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
	/ "/\\" { return new L.AST.InfixOperator('/\\'); }
	/ "\\/" { return new L.AST.InfixOperator('\\/'); }
	// "->" { return new L.AST.InfixOperator('->'); }
	/ "<-" { return new L.AST.InfixOperator('<-'); }
	/ ".." { return new L.AST.InfixOperator('..'); }
	/ "~>" { return new L.AST.InfixOperator('~>'); }
	/ "<~" { return new L.AST.InfixOperator('<~'); }
	/ "??" { return new L.AST.InfixOperator('??'); }
	/ "::" { return new L.AST.InfixOperator('::'); }
	// ":" { return new L.AST.InfixOperator(':'); }
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
	/ "^" { return new L.AST.PrefixOperator('^'); }
	/ "\\" { return new L.AST.PrefixOperator('\\'); }


function
	= il:identifierList _ "->" _ b:block { return new L.AST.Function(il, b, {type: 'thin'}); }
	/ il:identifierList _ "=>" _ b:block { return new L.AST.Function(il, b, {type: 'fat'}); }

block
	= "{" __ exps:(expressionList)? "}" { 
			var list;
			
			if (exps && exps.type === 'ExpressionList') {
				list = exps.list;
			} else if (exps) {
				list = [exps];
			} else {
				list = [];
			}
			
			return new L.AST.Block(list);
		}

identifierList
	= "(" _ idl:(first:identifier rest:($ _ id:identifier { return id; })* $? {
			return new L.AST.List([first].concat(rest), {source: 'identifierList'});
		}) ? _ ")" {
			return idl || new L.AST.List([], {source: 'identifierList'});
		}

list
	= "[" __ el:pureExpressionList ? __ "]" {
			if (!el) {
				return new L.AST.List([], {source: 'list'});
			} else if (el.type === 'ExpressionList') {
				// Expression lists are actually just expressions if there's just one
				return new L.AST.List(el.list, {source: 'list'});
			} else {
				return new L.AST.List([el], {source: 'list'});
			}
		}

dictionary
	= "[" __ kvl:keyValueList ? __ "]" { 
				return kvl || new L.AST.Dictionary([]);
			}

keyValueList
	= first:keyValuePair rest:($ _ kvp:keyValuePair { return kvp; })* $ ? _ {
			return new L.AST.Dictionary([first].concat(rest));
		}

keyValuePair
	= key:pureExpression _ ":" _ val:pureExpression {
			return new L.AST.KeyValuePair(key, val);
		}

identifier
	= n:name mod:postfixModifier? {
			n.tags['modifier'] = mod || null;
			return n;
		}

name
	= first:[a-zA-Z_] rest:[a-zA-Z0-9_-]* {
			return new L.AST.Identifier(first + rest.join(''));
		}

postfixModifier
	= "?" { return '?'; }
	/ "!" { return '!'; }


string
	// potentially disallow new lines, control chars, etc.
	= "\"" str:(escapedChar / [^"])* "\"" { return new L.AST.String(str.join('')); }
	/ "'" str:(escapedChar / [^'])* "'" { return new L.AST.String(str.join('')); }

escapedChar
	= '\\' char:[ntb"'\\] {
			return ({'"': '"', "'": "'", n: '\n', t: '\t', '\\': '\\'})[char];
		}

number
	= imaginary
	/ scientific
	/ hex
	/ decimal
	/ integer

integer
	= "0" { return new L.AST.Integer(0, {'source_base': 10}); }
	/ first:[1-9] rest:[0-9]* {
			var val = parseInt(first + rest.join(''), 10);
			return new L.AST.Integer(val, {'source_base': 10});
		}

decimal
	= int:integer "." digits:[0-9]* {
			var fraction = parseInt(digits.join(''), 10) || 0;
			var factor = Math.pow(10, digits.length);
			return new L.AST.Decimal(int.value * factor + fraction, digits.length);
		}

scientific
	= sig:integer [eE] [+-]? mant:integer {
			return new L.AST.Scientific(sig.value, mant.value);
		}
	/ sig:decimal [eE] [+-]? mant:integer {
			return new L.AST.Scientific(sig.value, mant.value);
		}

hex
	= "0x0" { return new L.AST.Integer(0, {'source_base': 16}); }
	/ "0x" first:[1-9a-fA-F] rest:[0-9a-fA-F]* {
			var val = parseInt(first + rest.join(''), 16);
			return new L.AST.Integer(val, {'source_base': 16});
		}

imaginary
	= num:(scientific / hex / decimal / integer) [ijJ] { return new L.AST.Imaginary(num); }

_
	= (" " / "\t")*

__
	= (" " / "\t" / "\n")*

$
	= ("," / "\n" / ",\n")
