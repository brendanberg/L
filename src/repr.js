var AST = require('./ast');

function stringify(node) {
	return node.toString();
}

function inspectify(depth, fmt) {
	return function (node) {
		return node.inspect(depth, fmt);
	}
}

(function(AST) {
	AST.InfixExpression.prototype.toString = function () {
		return this.lhs.toString() + ' ' + this.op.op + ' ' + this.rhs.toString();
	};

	AST.InfixExpression.prototype.inspect = function(depth, fmt) {
		return (
			this.lhs.inspect(depth) + 
			fmt.stylize(' ' + this.op.op + ' ', 'operator') +
			this.rhs.inspect(depth)
		);
	};
	
	AST.PrefixExpression.prototype.toString = function() {
		return this.op.op + this.exp.toString();
	};
	
	AST.Function.prototype.toString = function() {
		var arrow = ({fat: ' => ', thin: ' -> '})[this.tags['type'] || 'thin'];
		return this.plist.toString() + arrow + this.block.toString();
	};

	AST.Function.prototype.inspect = function(depth, fmt) {
		var arrow = ({fat: ' => ', thin: ' -> '})[this.tags['type'] || 'thin'];
		return (
			this.plist.inspect(depth) +
			fmt.stylize(arrow, 'delimiter') +
			this.block.inspect(depth)
		);
	};

	AST.Invocation.prototype.toString = function() {
		return this.target.toString() + ' ' + this.params.toString();
	};

	AST.Invocation.prototype.inspect = function(depth, fmt) {
		return (
			this.target.inspect(depth) + ' ' +
			this.params.inspect(depth)
		);
	};
	
	AST.Block.prototype.toString = function () {
		return '{\n' + this.expressionList.toString() + '\n}';
	};

	AST.Block.prototype.inspect = function(depth, fmt) {
		var exps = this.expressionList.map(inspectify(depth, fmt));
		return (
			fmt.stylize('{', 'delimiter') + '\n    ' +
			exps.join('\n').replace(/\n/g, '\n    ') + '\n' +
			fmt.stylize('}', 'delimiter')
		);
	};
	
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

	AST.List.prototype.inspect = function(depth, fmt) {
		var delims = this.delimiters[this.tags['source'] || 'list'];
		return (
			fmt.stylize(delims[0], 'delimiter') +
			this.list.map(inspectify(depth, fmt)).join(fmt.stylize(', ', 'delimiter')) +
			fmt.stylize(delims[1], 'delimiter')
		);
	};
	
	AST.Dictionary.prototype.toString = function() {
		return '[' + this.kvl.map(stringify).join(', ') + ']';
	};

	AST.Dictionary.prototype.inspect = function(depth, fmt) {
		return (
			fmt.stylize('[', 'delimiter') + 
			this.kvl.map(inspectify(depth, fmt)).join(fmt.stylize(', ', 'delimiter')) +
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

	AST.Identifier.prototype.inspect = function() {
		return fmt.stylize(this.name + (this.tags['identifier'] || ''), 'name');
	};
	
	AST.ExpressionList.prototype.toString = function () {
		var list = this.list.map(stringify).join('\n');
		return list;
	};

	AST.ExpressionList.prototype.inspect = function(depth, fmt) {
		return this.list.map(inspectify(depth, fmt)).join('\n');
	};
	
	AST.KeyValueList.prototype.toString = function () {
		var pairs = this.list.map(stringify).join('\n');
		return '[\n' + pairs + '\n]';
	};
	
	AST.KeyValuePair.prototype.toString = function () {
		return this.key.toString() + ': ' + this.val.toString();
	};
	
	AST.KeyValuePair.prototype.inspect = function (depth) {
		return (
			this.key.inspect(depth) + fmt.stylize(': ', 'operator') +
			this.val.inspect(depth)
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

	AST.String.prototype.inspect = function(depth, fmt) {
		return fmt.stylize(this.toString(), 'string');
	};
	
	AST.Integer.prototype.toString = function () {
		var baseMap = {
			10: function(x) { return x.toString(); },
			16: function(x) { return '0x' + x.toString(16).toUpperCase(); }
		};
		return baseMap[this.tags['source_base'] || 10](this.value);
	};

	AST.Integer.prototype.inspect = function(depth, fmt) {
		return fmt.stylize(this.toString(), 'number');
	};
	
	AST.Rational.prototype.toString = function () {
		var rat = this.simplify();
		var denom = rat.denominator === 1 ? "" : " / " + rat.denominator.toString();
		return rat.numerator.toString() + denom;
	};

	AST.Rational.prototype.inspect = function(depth, fmt) {
		return fmt.stylize(this.toString(), 'number');
	};
	
	AST.Decimal.prototype.toString = function () {
		var exponent = Math.pow(10, this.exponent);
		var wholePart = Math.floor(this.numerator / exponent);
		var fraction = this.exponent ? this.zeroPad(this.numerator % exponent, this.exponent) : '';
		return wholePart.toString() + "." + fraction;
	}

	AST.Decimal.prototype.inspect = function(depth, fmt) {
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

	AST.Imaginary.prototype.inspect = function(depth, fmt) {
		return fmt.stylize(this.toString(), 'number');
	};
	
	AST.Complex.prototype.toString = function () {
		return this.real.toString() + "+" + this.imaginary.toString();
	};

	AST.Complex.prototype.inspect = function(depth, fmt) {
		return fmt.stylize(this.toString(), 'number');
	};
})(AST);
