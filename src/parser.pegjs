{
	var L = {};
	L.AST = require('./ast');
}
start
	= expressionList

expressionList
	= first:expression rest:(_S _ exp:expression { return exp; } )* _S? _ {
			if (rest.length > 0) {
				return new L.AST.ExpressionList([first].concat(rest));
			} else {
				return first;
			}
		}

pureExpressionList
	= first:pureExpression rest:(_S _ exp:pureExpression { return exp; } )* _S? _ {
			if (rest.length > 0) {
				return new L.AST.ExpressionList([first].concat(rest));
			} else {
				return first;
			}
		}

expression
  = assignment
	/ messageSend
	/ pureExpression

assignment "assignment"
	= e1:pureExpression _ ':' _ e2:pureExpression {
			var op = new L.AST.InfixOperator(':');
			return new L.AST.InfixExpression(op, e1, e2);
		}

messageSend "message send"
	= e1:pureExpression _ '<-' _ e2:pureExpression {
			return new L.AST.MessageSend(null, e1, e2);
		}

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
	= val:value _ lst:list {
			return new L.AST.Lookup(val, lst);
		}
	/ val:value more:(_ it:parameterList { return it; })+ {
			var expr = val;
			for(var i = 0, len = more.length; i < len; i++) {
				var item = more[i];
				expr = new L.AST.Invocation(expr, item);
			}
			return expr;
		}
	/ prefixExpression
	/ value

parameterList "parameter list"
	= _ '(' __ first:(keyValuePair / pureExpression) rest:(
			_S _ item:(keyValuePair / pureExpression) { return item; }
		)* _S? __ ')' {
			return new L.AST.List([first].concat(rest), {source: 'parameterList'});
		}
	/ _ '(' __ ')' { return new L.AST.List([], {source: 'parameterList'}); }
	
prefixExpression
	= op:prefixOperator _ e:value {
			return new L.AST.PrefixExpression(op, e);
		}

value "value"
	= function
	/ match
	/ list
	/ dictionary
	/ identifier
	/ string
	/ number
	/ block
	/ '(' e:expression ')' { e.tags['parenthesized'] = true; return e; }
	/ type

infixOperator "infix operator"
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
	/ "@" { return new L.AST.InfixOperator('@'); }
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

prefixOperator "prefix operator"
	= "+" { return new L.AST.PrefixOperator('+'); }   // arithmetic no-op
	/ "-" { return new L.AST.PrefixOperator('-'); }   // arithmetic negation
	/ "~" { return new L.AST.PrefixOperator('~'); }   // ?
	/ "!" { return new L.AST.PrefixOperator('!'); }   // logical not
	/ "^" { return new L.AST.PrefixOperator('^'); }   // ?
	/ "\\" { return new L.AST.PrefixOperator('\\'); } // eager override
	// "?" { return new L.AST.PrefixOperator('?'); }   // pattern match
	// "*" { return new L.AST.PrefixOperator('*'); }   // destructure / dereference


function "function"
	= il:identifierList _ "->" _ b:(block / match / function) {
			return new L.AST.Function(il, b, {type: 'thin'});
		}
	// il:identifierList _ "=>" _ b:block { return new L.AST.Function(il, b, {type: 'fat'}); }

match "match"
	= "(" __ dict:(keyValueList) ")" {
			return new L.AST.Match(dict.kvl);
		}

block "block"
	= "{" __ exps:(expressionList)? "}" { 
			var list;
			
			if (exps && exps.type === 'ExpressionList') {
				list = exps.list;
			} else if (exps) {
				list = [exps];
			} else {
				list = [];
			}
			
			return new L.AST.Block(new L.AST.ExpressionList(list));
		}

identifierList
	= "(" _ idl:(first:identifier rest:(_S _ id:identifier { return id; })* _S? {
			return new L.AST.List([first].concat(rest), {source: 'identifierList'});
		}) ? _ ")" {
			return idl || new L.AST.List([], {source: 'identifierList'});
		}

list "list"
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

dictionary "dictionary"
	= "[" __ kvl:keyValueList ? __ "]" { 
				return kvl || new L.AST.Dictionary([]);
			}

keyValueList
	= first:keyValuePair rest:(_S _ kvp:keyValuePair { return kvp; })* _S ? _ {
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

type "type"
	= "<" __ kvl:keyValueList ? __ ">" {
			return new L.AST.Struct(null, kvl.kvl);
		}
	/ "<" __  idl:(first:identifier rest:(_S _ id:identifier { return id; })* ) __ ">" {
			return new L.AST.Struct(null, idl);
		}

string "string"
	// potentially disallow new lines, control chars, etc.
	= "\"" str:(escapedChar / [^"])* "\"" { return new L.AST.String(str.join('')); }
	/ "'" str:(escapedChar / [^'])* "'" { return new L.AST.String(str.join('')); }

escapedChar
	= '\\' char:[ntb"'\\] {
			return ({'"': '"', "'": "'", n: '\n', t: '\t', '\\': '\\'})[char];
		}

number "number"
	= imaginary
	/ scientific
	/ hex
	/ decimal
	/ integer

integer "integer"
	= "0" { return new L.AST.Integer(0, {'source_base': 10}); }
	/ first:[1-9] rest:[0-9]* {
			var val = parseInt(first + rest.join(''), 10);
			return new L.AST.Integer(val, {'source_base': 10});
		}

decimal "decimal"
	= int:integer "." digits:[0-9]* {
			var fraction = parseInt(digits.join(''), 10) || 0;
			var factor = Math.pow(10, digits.length);
			return new L.AST.Decimal(int.value * factor + fraction, digits.length);
		}

scientific "scientific"
	= sig:integer [eE] [+-]? mant:integer {
			return new L.AST.Scientific(sig.value, mant.value);
		}
	/ sig:decimal [eE] [+-]? mant:integer {
			return new L.AST.Scientific(sig.value, mant.value);
		}

hex "hexidecimal"
	= "0x0" { return new L.AST.Integer(0, {'source_base': 16}); }
	/ "0x" first:[1-9a-fA-F] rest:[0-9a-fA-F]* {
			var val = parseInt(first + rest.join(''), 16);
			return new L.AST.Integer(val, {'source_base': 16});
		}

imaginary "imaginary"
	= num:(scientific / hex / decimal / integer) [ijJ] { return new L.AST.Imaginary(num); }

_ "whitespace"
	= (" " / "\t")*

__ "whitespace"
	= (" " / "\t" / "\n")*

_S "separator"
	= ("," / "\n" / ",\n")
