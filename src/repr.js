var AST = require('./ast');

function stringify(node) {
	return node.toString();
}

function format(depth, fmt) {
	return function (node) {
		return node.repr(depth, fmt);
	}
}

(function(AST) {
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
		return this.plist.toString() + arrow + this.block.toString();
	};

	AST.Function.prototype.repr = function(depth, fmt) {
		var arrow = ({fat: ' => ', thin: ' -> '})[this.tags['type'] || 'thin'];
		return (
			this.plist.repr(depth, fmt) +
			fmt.stylize(arrow, 'delimiter') +
			this.block.repr(depth, fmt)
		);
	};

	AST.Match.prototype.toString = function() {
		return "(\n" + this.kvl.map(stringify) + "\n)";
	};

	AST.Match.prototype.repr = function(depth, fmt) {
		//TODO: smart newlines for compact reprs
		return (
			fmt.stylize('(', 'delimiter') + '\n    ' +
			this.kvl.map(format(depth, fmt)).join(
				fmt.stylize('\n', 'delimiter')
			).replace(/\n/g, '\n    ') + '\n' +
			fmt.stylize(')', 'delimiter')
		);
	};

	/*AST.Method.prototype.toString = function() {
		return (
			this.typeId.toString() + '(' +
			this.plist.list.map(function(x) {
				var param = x[0].name;
				if (x[1]) {
					param += ': ' + x[0].toString();
				}
				return param;
			}).join(', ') + ')' +
			' -> ' + this.block.toString()
		);
		return undefined;
	};

	AST.Method.prototype.repr = function(depth, fmt) {
		return (
			this.typeId.repr(depth, fmt) +
			fmt.stylize('(', 'delimiter') +
			this.plist.list.map(function(x) {
				var parameter = fmt.stylize(x[0].name, 'name');
				if (x[1]) {
					parameter += (fmt.stylize(':', 'separator') + ' ' +
						x[1].repr(depth, fmt)
					);
				}
				return parameter;
			}).join(fmt.stylize(',', 'separator') + ' ') +
			fmt.stylize(')', 'delimiter') +
			' -> ' + this.block.repr(depth, fmt)
		);
		return undefined;
	};*/

	AST.Invocation.prototype.toString = function() {
		return this.target.toString() + ' ' + this.params.toString();
	};

	AST.Invocation.prototype.repr = function(depth, fmt) {
		return (
			this.target.repr(depth, fmt) + ' ' +
			this.params.repr(depth, fmt)
		);
	};
	
	AST.Block.prototype.toString = function () {
		return '{\n' + this.expressionList.toString() + '\n}';
	};

	AST.Block.prototype.repr = function(depth, fmt) {
		var exps = this.expressionList.list.map(format(depth, fmt));
		return (
			fmt.stylize('{', 'delimiter') + '\n    ' +
			exps.join('\n').replace(/\n/g, '\n    ') + '\n' +
			fmt.stylize('}', 'delimiter')
		);
	};

	AST.Struct.prototype.toString = function() {
		return "< " + this.members.map(stringify).join(', ') + " >";
	};
	
	AST.Struct.prototype.repr = function(depth, fmt) {
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

	AST.Tag.prototype.toString = function() {
		return (this.tags.type || '') + '.' + this.name;
	};

	AST.Tag.prototype.repr = function(depth, fmt) {
		return fmt.stylize(this.toString(), 'name');
	};

	AST.Value.prototype.toString = function() {
		var name = this._super && this._super.name || 'Value';
		var vals = [];
		for (var i in this.values) {
			vals.push(i + ': ' + this.values[i].toString());
		}
		return name + "(" + vals.join(', ') + ")";
	};

	AST.Value.prototype.repr = function(depth, fmt) {
		var name = this._super && this._super.name || 'Value';
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
	}

	AST.List.prototype.toString = function() {
		var delims = this.delimiters[this.tags['source'] || 'list'];
		return delims[0] + this.list.map(stringify).join(', ') + delims[1];
	};

	AST.List.prototype.delimiters = {
		dictionary: ['[',']'],
		list: ['[',']'],
		identifierList: ['(',')'],
		parameterList: ['(',')']
	};

	AST.List.prototype.repr = function(depth, fmt) {
		var delims = this.delimiters[this.tags['source'] || 'list'];
		return (
			fmt.stylize(delims[0], 'delimiter') +
			this.list.map(format(depth, fmt)).join(fmt.stylize(', ', 'delimiter')) +
			fmt.stylize(delims[1], 'delimiter')
		);
	};
	
	AST.Dictionary.prototype.toString = function() {
		return '[' + this.kvl.map(stringify).join(', ') + ']';
	};

	AST.Dictionary.prototype.repr = function(depth, fmt) {
		return (
			fmt.stylize('[', 'delimiter') + 
			this.kvl.map(format(depth, fmt)).join(fmt.stylize(', ', 'delimiter')) +
			fmt.stylize(']', 'delimiter')
		);
	};
	
	AST.MessageSend.prototype.toString = function () {
		return (this.receiver ? this.receiver.toString() : '') + this.message.toString();
	};
	
	AST.Message.prototype.toString = function () {
		return '.' + this.identifier.toString() + (this.params ? this.params.toString() : '');
	};
	
	AST.Identifier.prototype.toString = function () {
		return this.name + (this.tags['modifier'] || '');
	};

	AST.Identifier.prototype.repr = function(depth, fmt) {
		return fmt.stylize(this.name + (this.tags['identifier'] || ''), 'name');
	};
	
	AST.ExpressionList.prototype.toString = function () {
		var list = this.list.map(stringify).join('\n');
		return list;
	};

	AST.ExpressionList.prototype.repr = function(depth, fmt) {
		return this.list.map(format(depth, fmt)).join('\n');
	};
	
	AST.KeyValueList.prototype.toString = function () {
		var pairs = this.list.map(stringify).join('\n');
		return '[\n' + pairs + '\n]';
	};
	
	AST.KeyValuePair.prototype.toString = function () {
		return this.key.toString() + ': ' + this.val.toString();
	};
	
	AST.KeyValuePair.prototype.repr = function (depth, fmt) {
		return (
			this.key.repr(depth, fmt) + fmt.stylize(': ', 'operator') +
			this.val.repr(depth, fmt)
		);
	};

	AST.String.prototype.toString = function () {
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

	AST.String.prototype.repr = function(depth, fmt) {
		return fmt.stylize(this.toString(), 'string');
	};
	
	AST.Integer.prototype.toString = function () {
		var baseMap = {
			10: function(x) { return x.toString(); },
			16: function(x) { return '0x' + x.toString(16).toUpperCase(); }
		};
		return baseMap[this.tags['source_base'] || 10](this.value);
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
	
	AST.Imaginary.prototype.toString = function () {
		return this.magnitude.toString() + "i";
	};

	AST.Imaginary.prototype.repr = function(depth, fmt) {
		return fmt.stylize(this.toString(), 'number');
	};
	
	AST.Complex.prototype.toString = function () {
		return this.real.toString() + "+" + this.imaginary.toString();
	};

	AST.Complex.prototype.repr = function(depth, fmt) {
		return fmt.stylize(this.toString(), 'number');
	};

	AST.Bool.prototype.toString = function () {
		return this.value ? 'True' : 'False';
	};

	AST.Bool.prototype.repr = function(depth, fmt) {
		return fmt.stylize(this.toString(), 'boolean');
	};

	AST.Bottom.prototype.toString = function () {
		return '_';
	};

	AST.Bottom.prototype.repr = function(depth, fmt) {
		return fmt.stylize(this.toString(), 'boolean');
	};
})(AST);
