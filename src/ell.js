var repl = require('repl');
var L = require('./l');
var util = require('util');
var debug = util.debuglog('repl');

var ctx = new L.Context();
var str = '';
var rep;

var fs = require('fs');
var path = require('path');

var basepath = path.resolve('./lib');
var filenames = fs.readdirSync(basepath).filter(function(filename) {
	return filename.match(/^[^\.].+\.ell$/) ? true : false;
});
var contents, ast = null;

for (var i = 0, len = filenames.length; i < len; i++) {
	contents = fs.readFileSync(path.join(basepath, filenames[i]), 'utf-8');

	try {
		ast = L.Parser.parse(contents);
	} catch (e) {
		var result = e.toString();
		
		if (e.line && e.column) {
			result += '\nline ' + e.line + ', column ' + e.column;
		} else {
			result += '\n' + e.stack.replace(/^[^\n]+\n/, '');
		}

		console.log(result);
	}

	if (ast) {
		ast.eval(ctx);
	}
}

console.log('The L Programming Language, v' + L.version);

rep = repl.start({
	ignoreUndefined: true,
	prompt: ">> ",
	eval: eval,
	writer: writer
});
rep.removeAllListeners('line');
rep.on('line', function(cmd) {
	debug('line %j', cmd);
	sawSIGINT = false;
	var skipCatchall = false;
	cmd = trimWhitespace(cmd);

	// Check to see if a REPL keyword was used. If it returns true,
	// display next prompt and return.
	if (cmd && cmd.charAt(0) === '#' && isNaN(parseFloat(cmd))) {
		var matches = cmd.match(/^# !([^\s]+)\s*(.*)$/);
		var keyword = matches && matches[1];
		var rest = matches && matches[2];
		if (rep.parseREPLKeyword(keyword, rest) === true) {
			return;
		}/* else {
			rep.outputStream.write('Invalid REPL keyword\n');
			skipCatchall = true;
		}*/
	}

	if (!skipCatchall) {
		var evalCmd = rep.bufferedCommand + cmd;
		if (/^\s*\{/.test(evalCmd) && /\}\s*$/.test(evalCmd)) {
			// It's confusing for `{ a : 1 }` to be interpreted as a block
			// statement rather than an object literal.	So, we first try
			// to wrap it in parentheses, so that it will be interpreted as
			// an expression.
			evalCmd = '(' + evalCmd + ')\n';
		} else {
			// otherwise we just append a \n so that it will be either
			// terminated, or continued onto the next expression if it's an
			// unexpected end of input.
			evalCmd = evalCmd + '\n';
		}

		debug('eval %j', evalCmd);
		rep.eval(evalCmd, rep.context, 'repl', finish);
	} else {
		finish(null);
	}
	function finish(e, ret) {
		debug('finish', e, ret);
		rep.memory(cmd);

		if (e && !rep.bufferedCommand && cmd.trim().match(/^npm /)) {
			rep.outputStream.write('npm should be run outside of the ' +
									'node repl, in your normal shell.\n' +
									'(Press Control-D to exit.)\n');
			rep.bufferedCommand = '';
			rep.displayPrompt();
			return;
		}

		// If error was SyntaxError and not JSON.parse error
		if (e) {
			if (e instanceof Recoverable) {
				// Start buffering data like that:
				// {
				// ...	x: 1
				// ... }
				rep.bufferedCommand += cmd + '\n';
				rep.displayPrompt();
				return;
			} else {
				rep._domain.emit('error', e);
			}
		}

		// Clear buffer if no SyntaxErrors
		rep.bufferedCommand = '';

		// If we got any output - print it (if no error)
		if (!e && (!rep.ignoreUndefined || !util.isUndefined(ret))) {
			rep.context._ = ret;
			rep.outputStream.write(rep.writer(ret) + '\n');
		}

		// Display prompt again
		rep.displayPrompt();
	};
});

function trimWhitespace(cmd) {
  var trimmer = /^\s*(.+)\s*$/m,
      matches = trimmer.exec(cmd);

  if (matches && matches.length === 2) {
    return matches[1];
  }
  return '';
}

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
	var command = cmd.replace(/^\((.*)\)$/, '$1').replace(/\n$/, '');
	var level = command.match(/^!log (\w+)/);
	var ast, result;

	// Special cases for changing logging levels
	if (level) {
		L.log.setLevel(level[1]);
		console.log("Set logging level to '" + level[1] + "'");
		rep.displayPrompt();
		return;
	}

	command = str + command;
	if (command.trim() === '') {
		//callback(null, undefined);
		rep.displayPrompt();
		return;
	}

	try {
		ast = L.Parser.parse(command);
		str = '';
		rep.setPrompt('>> ');
	} catch (e) {
		L.log.info(function() { return e.toString(); });
		if (e.found == null) {
			str = command + '\n';
			rep.setPrompt(' - ');
			rep.displayPrompt();
			return;
		}

		result = fmt.stylize(e.toString(), 'error');
		
		if (e.line && e.column) {
			// Parser errors come with line, column, offset, expected,
			// and found properties.
			var pointer = Array(e.column).join(' ') + fmt.stylize('^', 'string');
			result = '   ' + pointer + '\n' + result;
			str = '';
			rep.setPrompt('>> ');
		} else {
			result += '\n' + fmt.stylize(e.stack.replace(/^[^\n]+\n/, ''), 'string');
		}

		callback(null, result);
		return;
	}

	try {
		L.log.info(JSON.stringify(ast));	
		result = ast.eval(ctx);	
	} catch (e) {
		result = fmt.stylize(e.toString(), 'error');
		
		if (e.stack) {
			result += '\n' + fmt.stylize(e.stack.replace(/^[^\n]+\n/, ''), 'string');
		}
	} finally {
		callback(null, result);
	}
}
