var repl = require('repl');
var L = require('./l');

var ctx = new L.Context();
var str = '';
var rep;

rep = repl.start({
	ignoreUndefined: true,
	prompt: ">> ",
	eval: eval,
	writer: writer
});

rep.on('exit', function() {
	console.log('');
});

var fmt = {
	depth: null,
	stylize: function(str, styleType) {
		var style = this.styles[styleType];

		if (style) {
			return ('\u001b[' + this.colors[style][0] + 'm' + str +
					'\u001b[' + this.colors[style][1] + 'm');
		} else {
			return str;
		}
	},
	styles: {
		number: 'yellow',
		string: 'green',
		boolean: 'yellow',
		operator: 'magenta',
		name: 'blue',
		delimiter: 'cyan',
		error: 'red',
		comment: 'white'
	},
	colors: {
		'bold' : [1, 22],
		'italic' : [3, 23],
		'underline' : [4, 24],
		'inverse' : [7, 27],
		'white' : [37, 39],
		'grey' : [90, 39],
		'black' : [30, 39],
		'blue' : [34, 39],
		'cyan' : [36, 39],
		'green' : [32, 39],
		'magenta' : [35, 39],
		'red' : [31, 39],
		'yellow' : [33, 39]
	}
};

function writer(obj) {
	if (typeof obj === 'object') {
		if ('repr' in obj) {
			return obj.repr(fmt.depth, fmt);
		} else {
			return obj.toString();
		}
	} else {
		return obj.toString();
	}
}

function eval(cmd, context, filename, callback) {
	// The node repl module before 0.10.26 parenthesized
	// the command passed to the eval function. By version
	// 0.12.4, it didn't parenthesize commands.
	// ---
	// Trailing newlines are verboten.
	var command = str + cmd.replace(/^\((.*)\)$/, '$1').replace(/\n$/, '');
	var ast, result;

	// Process the command before attempting to parse. If the delimiters
	// are not balanced, don't even try parsing; just buffer the command,
	// set the prompt and return.
	/*
	var opPattern = /<=|>=|<-|->|=>|~>|<~/;
	var delimPattern = /[^\[{\(<>\)}\]]+/g;
	var arrowPattern = /\)>([{\(])/g;
	var cmd_delims = command.replace(delimPattern, '').replace(arrowPattern, ')$1');
	var openers = {'[': ']', '{': '}', '(': ')', '<': '>'};
	var closers = {']': '[', '}': '{', ')': '(', '>': '<'};
	var stack = [];
	var delim;

	// We extract only the delimiters from the command and iterate through
	// building a stack.
	for (var i = 0, len = cmd_delims.length; i < len; i++) {
		if (cmd_delims[i] in openers) {
			stack.push(cmd_delims[i]);
		} else if (closers[cmd_delims[i]] === stack[stack.length - 1]) {
			stack.pop();
		} else {
			str = '';
			rep.setPrompt('>> ');
			result = (
				"Syntax Error: Unbalanced delimiters. Found '" + cmd_delims[i] +
				"' but expected '" + openers[stack[stack.length - 1]] + "'."
			);
			callback(null, fmt.stylize(result, 'error'));
			return;
		}
	}
	*/

/*	if (stack.length > 0) {
		//console.log('stack', stack.join(''));
		delim = fmt.stylize(stack[stack.length - 1], 'comment');
		rep.setPrompt(' ' + delim + '   ' + Array(stack.length).join('  '));
		str = command + '\n';
		callback(null, undefined);
		return;
	} else {
		str = '';
		rep.setPrompt('>> ');
	}*/

	if (command.trim() === '') {
		//callback(null, null);
		rep.displayPrompt();
		return;
	}

	try {
		ast = L.Parser.parse(command);
		str = '';
		rep.setPrompt('>> ');
	} catch (e) {
		result = fmt.stylize(e.toString(), 'error') + '\n';
		
		if (e.line && e.column) {
			var pointer = Array(e.column).join(' ') + fmt.stylize('^', 'string');
			result = '   ' + pointer + '\n' + result;

			result += fmt.stylize('    Line:     ' + e.line, 'string') + '\n';
			result += fmt.stylize('    Column:   ' + e.column, 'string') + '\n';
			result += fmt.stylize('    Offset:   ' + e.offset, 'string') + '\n';
			result += fmt.stylize('    Expected: ' + JSON.stringify(e.expected), 'string') + '\n';
			result += fmt.stylize('    Found:    ' + e.found, 'string') + '\n';
		} else {
			result += fmt.stylize(e.stack.replace(/^[^\n]+\n/, ''), 'string');
		}

		callback(null, result);
		return;
	}

	try {
		result = ast.eval(ctx);	
	} catch (e) {
		result = fmt.stylize(e.toString(), 'error') + '\n';
		
		if (e.stack) {
			result += fmt.stylize(e.stack.replace(/^[^\n]+\n/, ''), 'string');
		}
	} finally {
		callback(null, result);
	}
}

