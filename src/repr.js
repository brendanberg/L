var AST = require('./ast');
var Skeleton = require('./skeleton');

function stringify(node) {
	return node && node.toString();
}

function format(depth, fmt) {
	return function (node) {
		return node && node.repr(depth, fmt);
	}
}

(function(AST) {
	AST.Assignment.prototype.toString = function () {
		return this.template.toString() + ' :: ' + this.value.toString();
	};

	AST.Assignment.prototype.repr = function(depth, fmt) {
		return (
			this.template.repr(depth, fmt) + fmt.stylize(' :: ', 'operator') +
			this.value.repr(depth,fmt)
		);
	};

	AST.Template.prototype.toString = function () {
		return this.match.toString();
	};

	AST.Template.prototype.repr = function (depth, fmt) {
		return this.match.repr(depth, fmt);
	};

	AST.InfixExpression.prototype.toString = function () {
		return (this.lhs.toString() + ' ' +
			this.op.replace(/^'(.*)'$/, '$1') + ' ' + this.rhs.toString()
		);
	};

	AST.InfixExpression.prototype.repr = function(depth, fmt) {
		return (
			this.lhs.repr(depth, fmt) + 
			fmt.stylize(' ' + this.op.replace(/^'(.*)'$/, '$1') + ' ', 'operator') +
			this.rhs.repr(depth, fmt)
		);
	};
	
	AST.PrefixExpression.prototype.toString = function() {
		return this.op.replace(/^'(.*)'$/, '$1') + this.exp.toString();
	};

	AST.PrefixExpression.prototype.repr = function(depth, fmt) {
		return (
			fmt.stylize(this.op.replace(/^'(.*)'$/, '$1'), 'operator') + 
			this.exp.repr(depth, fmt)
		);
	};
	
	AST.Function.prototype.toString = function() {
		var arrow = ({fat: ' => ', thin: ' -> '})[this.tags['type'] || 'thin'];
		return '(' + this.plist.map(function(item) {
			return item.toString();
		}).toArray().join(', ') + ')' + arrow + this.block.toString();
	};

	AST.Function.prototype.repr = function(depth, fmt) {
		var arrow = ({fat: ' => ', thin: ' -> '})[this.tags['type'] || 'thin'];
		return (
			'(' + this.plist.map(function(p) { return p.repr(depth, fmt) }).toArray().join(', ') + ')' +
			fmt.stylize(arrow, 'delimiter') +
			this.block.repr(depth, fmt)
		);
	};

	AST.FunctionCall.prototype.toString = function () {
		return this.target.toString() + ' (' + this.plist.map(function(it) {
			return it.toString();
		}).toArray().join(', ') + ')';
	};

	AST.FunctionCall.prototype.repr = function (depth, fmt) {
		return this.target.repr(depth, fmt) + ' (' + this.plist.map(function(it) {
			return it.repr(depth, fmt);
		}).toArray().join(', ') + ')';
	};

	AST.Parenthesized.prototype.toString = function () {
		return '(' + this.expr.toString() + ')';
	};

	AST.Parenthesized.prototype.repr = function (depth, fmt) {
		return (
			fmt.stylize('(', 'delimiter') +
			this.expr.repr(depth, fmt) +
			fmt.stylize(')', 'delimiter')
		);
	};

	AST.Match.prototype.toString = function() {
		return "(\n" + this.kvlist.map(stringify) + "\n)";
	};

	AST.Match.prototype.repr = function(depth, fmt) {
		//TODO: smart newlines for compact reprs
		return (
			fmt.stylize('(', 'delimiter') + '\n    ' +
			this.kvlist.map(format(depth, fmt)).join(
				fmt.stylize('\n', 'delimiter')
			).replace(/\n/g, '\n    ') + '\n' +
			fmt.stylize(')', 'delimiter')
		);
	};

	AST.Invocation.prototype.toString = function() {
		return this.target.toString() + ' ' + this.plist.toString();
	};

	AST.Invocation.prototype.repr = function(depth, fmt) {
		return (
			this.target.repr(depth, fmt) + ' ' +
			this.plist.repr(depth, fmt)
		);
	};

	AST.ListAccess.prototype.toString = function() {
		return (
			this.target.toString() + '[' + 
			this.terms.map(function(t) {
				return t.toString();
			}).toArray().join(', ') + ']'
		);
	}

	AST.ListAccess.prototype.repr = function(depth, fmt) {
		return (
			this.target.repr(depth, fmt) +
			fmt.stylize('[', 'delimiter') +
			this.terms.map(function(t) {
				return t.repr(depth, fmt);
			}).toArray().join(', ') +
			fmt.stylize(']', 'delimiter')
		);
	}
	
	AST.PropertyLookup.prototype.toString = function() {
		return this.target.toString() + '.' + this.term.toString();
	}

	AST.PropertyLookup.prototype.repr = function(depth, fmt) {
		return (
			this.target.repr(depth, fmt) +
			fmt.stylize('.', 'operator') +
			this.term.repr(depth, fmt)
		);
	}
	
	AST.Block.prototype.toString = function () {
		return '{\n' + this.exprs.map(stringify).join('\n') + '\n}';
	};

	AST.Block.prototype.repr = function(depth, fmt) {
		var exps = this.exprs.map(format(depth, fmt));
		return (
			fmt.stylize('{', 'delimiter') + '\n    ' +
			exps.join('\n').replace(/\n/g, '\n    ') + '\n' +
			fmt.stylize('}', 'delimiter')
		);
	};

	AST.Record.prototype.toString = function() {
		return "< " + this.members.map(stringify).join(', ') + " >";
	};
	
	AST.Record.prototype.repr = function(depth, fmt) {
		if (this.name != null) {
			return fmt.stylize(this.name, 'name');
		}

		var members = this.members.map(format(depth, fmt));
		return (
			fmt.stylize("<", 'delimiter') + ' ' +
			members.join(fmt.stylize(", ", 'delimiter')) + ' ' +
			fmt.stylize(">", 'delimiter')
		);
	};

	AST.Option.prototype.repr = function(depth, fmt) {
		var variants = this.variants.map(format(depth, fmt));
		return (
			fmt.stylize('<', 'delimiter') + 
			variants.join(' ' + fmt.stylize('|', 'operator') + ' ') +
			fmt.stylize('>', 'delimiter')
		);
	};

	/*
	AST.Value.prototype.toString = function() {
		var name = this.getIn(['mommy', 'name'], 'Value');
		var vals = [];
		for (var i in this.values) {
			vals.push(i + ': ' + this.values[i].toString());
		}
		return name + "(" + vals.join(', ') + ")";
	};

	AST.Value.prototype.repr = function(depth, fmt) {
		var name = this.getIn(['mommy', 'name'], 'Value');
		var vals = [];
		for (var i in this.values) {
			vals.push(
				fmt.stylize(i, 'name') +
				fmt.stylize(':', 'separator') + ' ' +
				this.values[i].repr(depth, fmt)
			);
		}
		return (
			fmt.stylize(name, 'name') +
			fmt.stylize("(", 'delimiter') +
			vals.join(fmt.stylize(", ", 'delimiter')) +
			fmt.stylize(")", 'delimiter')
		);
	};
	*/

	AST.List.prototype.toString = function() {
		var delims = this.delimiters['list']; //this.getIn(['tags', 'source'], 'list')];
		return delims[0] + this.items.map(stringify).join(', ') + delims[1];
	};

	AST.List.prototype.delimiters = {
		dictionary: ['#[',']'],
		list: ['[',']'],
		identifierList: ['(',')'],
		parameterList: ['(',')']
	};

	AST.List.prototype.repr = function(depth, fmt) {
		var delims = this.delimiters[this.getIn(['tags', 'source'], 'list')];

		return (
			fmt.stylize(delims[0], 'delimiter') +
			this.items.map(format(depth, fmt)).join(fmt.stylize(', ', 'delimiter')) +
			fmt.stylize(delims[1], 'delimiter')
		);
	};
	
	AST.Map.prototype.toString = function() {
		return '[' + this.items.map(stringify).join(', ') + ']';
	};

	AST.Map.prototype.repr = function(depth, fmt) {
		return (
			fmt.stylize('[', 'delimiter') + 
			this.items.map(format(depth, fmt)).join(fmt.stylize(', ', 'delimiter')) +
			fmt.stylize(']', 'delimiter')
		);
	};

	AST.MessageSend.prototype.toString = function () {
		return (this.receiver ? this.receiver.toString() + '<-' : '') + this.message.toString();
	};

	AST.Message.prototype.toString = function () {
		return '<-' /*+ this.identifier.toString()*/ + (this.plist ? this.plist.toString() : '');
	};

	AST.Identifier.prototype.toString = function () {
		let type = this.getIn(['tags', 'type'], '');
		return (type && type + ' ') + this.label + (this.modifier || '');
	};

	AST.Identifier.prototype.repr = function(depth, fmt) {
		return fmt.stylize(this.toString(), 'name');
	};

	AST.Symbol.prototype.toString = function () {
		return '$' + this.label;
	};

	AST.Symbol.prototype.repr = function(depth, fmt) {
		return fmt.stylize(this.toString(), 'name');
	};

	AST.KeyValuePair.prototype.toString = function () {
		return this.key.toString() + ': ' + this.val.toString();
	};
	
	AST.KeyValuePair.prototype.repr = function (depth, fmt) {
		return (
			this.key.repr(depth, fmt) + fmt.stylize(': ', 'delimiter') +
			this.val.repr(depth, fmt)
		);
	};

	AST.Text.prototype.toString = function () {
		// Returns a quoted, escaped string suitable for input into the parser
		// By default we use single quotes. We replace newline, tab, and backslash
		// characters with their escaped selves. If the string contains both a
		// single and double quote character, we escape any instances of single
		// quotes and return the string. If the only unescaped quote character in
		// the string is single quote, we escape any instances of double quotes
		// and use double quotes as delimiters.
	
		var quote = "'";
		var ret = this.value.replace(/[\n\t\\]/g, function(match) {
			return ({
				"\n": "\\n",
				"\t": "\\t",
				"\\": "\\\\"
			})[match];
		});
	
		if (this.value.indexOf("'") !== -1) {
			if (this.value.indexOf('"') !== -1) {
				// String contains both ' and ".
				ret = ret.replace(/'/g, "\\'");
			} else {
				ret = ret.replace(/"/g, '\\"');
				quote = '"';
			}
		}
		return quote + ret + quote;
	};

	AST.Text.prototype.repr = function(depth, fmt) {
		return fmt.stylize(this.toString(), 'string');
	};
	
	AST.Integer.prototype.toString = function () {
		var baseMap = {
			10: function(x) { return x.toString(); },
			16: function(x) { return '0x' + x.toString(16).toUpperCase(); }
		};
		return baseMap[this.getIn(['tags', 'source_base'], 10)](this.value);
	};

	AST.Integer.prototype.repr = function(depth, fmt) {
		return fmt.stylize(this.toString(), 'number');
	};
	
	AST.Rational.prototype.toString = function () {
		var rat = this.simplify();
		var denom = rat.denominator === 1 ? "" : " / " + rat.denominator.toString();
		return rat.numerator.toString() + denom;
	};

	AST.Rational.prototype.repr = function(depth, fmt) {
		return fmt.stylize(this.toString(), 'number');
	};
	
	AST.Decimal.prototype.toString = function () {
		var exponent = Math.pow(10, this.exponent);
		var wholePart = Math.floor(this.numerator / exponent);
		var fraction = this.exponent ? this.zeroPad(this.numerator % exponent, this.exponent) : '';
		return wholePart.toString() + "." + fraction;
	}

	AST.Decimal.prototype.repr = function(depth, fmt) {
		return fmt.stylize(this.toString(), 'number');
	};
	
	AST.Decimal.prototype.zeroPad = function (num, len) {
		var n = Math.abs(num);
		var zeros = Math.max(0, len - Math.floor(n).toString().length);
		var zeroString = Math.pow(10, zeros).toString().substr(1);
		if (num < 0) {
			zeroString = '-' + zeroString;
		}
		return zeroString + n;
	}
	
	// TODO: === REAL ===
	
	AST.Complex.prototype.toString = function () {
		var real = this.get('real', null);
		return (real ? real.toString() + "+" : '') + this.imaginary.toString() + 'j';
	};

	AST.Complex.prototype.repr = function(depth, fmt) {
		var real = this.get('real', null);
		var repr = '';
		if (real) {
			repr = (
				fmt.stylize(real.toString(), 'number') +
				fmt.stylize('+', 'operator')
			);
		}
		return repr + fmt.stylize(this.imaginary.toString() + 'j', 'number');
	};

	AST.Bottom.prototype.toString = function () {
		return '_';
	};

	AST.Bottom.prototype.repr = function(depth, fmt) {
		return fmt.stylize(this.toString(), 'boolean');
	};

	AST.Error.prototype.toString = function () {
		let consumed = this.consumed ? this.consumed.toString() + ' ' : '';
		return (
			consumed +
			this.encountered.map(stringify).join(' ')
		);
	};

	AST.Error.prototype.repr = function(depth, fmt) {
		// Use the Skel repr funcs to print the error tokens.
		let consumed = this.consumed ? this.consumed.repr(depth, fmt) + ' ' : '';
		return (
			consumed + 
			fmt.stylize(
				fmt.stylize(this.encountered.map(stringify).join(' '), 'error'),
				'important'
			)
		);
	};
})(AST);

(function(Skel) {
	Skel.List.prototype.toString = function () {
		return '[' + this.exprs.map(function(x) {
			return x.toString();
		}).toArray().join(', ') + ']';
	};
	
	Skel.List.prototype.repr = function (depth, fmt) {
		return this.toString();
	};

	Skel.Message.prototype.toString = function () {
		return '(' + this.exprs.map(function(x) {
			return x.toString();
		}).toArray().join(', ') + ')';
	};

	Skel.Message.prototype.repr = function (depth, fmt) {
		return this.toString();
	};

	Skel.Type.prototype.toString = function () {
		return '<' + this.exprs.map(function(x) {
			return x.toString();
		}).toArray().join(', ') + '>';
	};

	Skel.Type.prototype.repr = function (depth, fmt) {
		return this.toString();
	};

	Skel.Expression.prototype.toString = function () {
		if (this.getIn(['tags', 'enclosure'], null) === 'parentheses') {
			return '(' + this.terms.map(stringify).join(' ') + ')';
		} else {
			return this.terms.map(stringify).join(' ');
		}
	};

	Skel.Expression.prototype.repr = function (depth, fmt) {
		return this.toString();
	};

	Skel.Operator.prototype.toString = function () {
		return this.label;
	};

	Skel.Operator.prototype.repr = function (depth, fmt) {
		return this.toString();
	};

	Skel.Symbol.prototype.toString = function () {
		return '$' + this.label;
	};

	Skel.Symbol.prototype.repr = function (depth, fmt) {
		return this.toString();
	};

	Skel.Identifier.prototype.toString = function () {
		return this.label + (this.modifier || '');
	};

	Skel.Identifier.prototype.repr = function (depth, fmt) {
		return this.toString();
	};

	Skel.Text.prototype.toString = function () {
		// Returns a quoted, escaped string suitable for input into the parser
		// By default we use single quotes. We replace newline, tab, and backslash
		// characters with their escaped selves. If the string contains both a
		// single and double quote character, we escape any instances of single
		// quotes and return the string. If the only unescaped quote character in
		// the string is single quote, we escape any instances of double quotes
		// and use double quotes as delimiters.
	
		var quote = "'";
		var ret = this.value.replace(/[\n\t\\]/g, function(match) {
			return ({
				"\n": "\\n",
				"\t": "\\t",
				"\\": "\\\\"
			})[match];
		});
	
		if (this.value.indexOf("'") !== -1) {
			if (this.value.indexOf('"') !== -1) {
				// String contains both ' and ".
				ret = ret.replace(/'/g, "\\'");
			} else {
				ret = ret.replace(/"/g, '\\"');
				quote = '"';
			}
		}
		return quote + ret + quote;
	};
	
	Skel.Text.prototype.repr = function (depth, fmt) {
		return this.toString();
	};

	Skel.Integer.prototype.toString = function () {
		var baseMap = {
			10: function(x) { return x.toString(); },
			16: function(x) { return '0x' + x.toString(16).toUpperCase(); }
		};
		return baseMap[this.getIn(['tags', 'source_base'], 10)](this.value);
	};
	
	Skel.Integer.prototype.repr = function (depth, fmt) {
		return this.toString();
	};

	Skel.Decimal.prototype.toString = function () {
		var exponent = Math.pow(10, this.exponent);
		var wholePart = Math.floor(this.numerator / exponent);
		var fraction = this.exponent ? this.zeroPad(this.numerator % exponent, this.exponent) : '';
		return wholePart.toString() + "." + fraction;
	};

	Skel.Decimal.prototype.zeroPad = function (num, len) {
		var n = Math.abs(num);
		var zeros = Math.max(0, len - Math.floor(n).toString().length);
		var zeroString = Math.pow(10, zeros).toString().substr(1);
		if (num < 0) {
			zeroString = '-' + zeroString;
		}
		return zeroString + n;
	};
	
	Skel.Decimal.prototype.repr = function (depth, fmt) {
		return this.toString();
	};

	Skel.Scientific.prototype.toString = function () {
	};

	Skel.Scientific.prototype.repr = function (depth, fmt) {
		return this.toString();
	};

	Skel.Complex.prototype.toString = function () {
		var real = this.get('real', null);
		return (real ? real.toString() + "+" : '') + this.imaginary.toString() + 'j';
	};

	Skel.Complex.prototype.repr = function (depth, fmt) {
		return this.toString();
	};
})(Skeleton);

