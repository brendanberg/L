#! /usr/bin/env node

let repl = require('repl');
const L = require('./l');
let util = require('util');
let debug = util.debuglog('repl');

let ctx = new L.Context();
let str = '';
let rep;

let fs = require('fs');
let path = require('path');

let basepath = path.join(path.dirname(fs.realpathSync(__filename)), '/lib');
let filenames = fs.readdirSync(basepath).filter(function(filename) {
	return filename.match(/^[^\.].+\.ell$/) ? true : false;
});
let contents, ast = null;

const style = require('./format');


for (let i = 0, len = filenames.length; i < len; i++) {
	contents = fs.readFileSync(path.join(basepath, filenames[i]), 'utf-8');

	try {
		//ast = L.Parser.parse(contents).transform(ctx, L.Rules);
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

console.log(style.operator('The L Programming Language, Meta-L v' + L.version));

rep = repl.start({
	ignoreUndefined: true,
	prompt: ">> ",
	eval: eval,
	writer: writer
});
rep.removeAllListeners('line');
rep.on('line', function(cmd) {
	debug('line %j', cmd);
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
		var evalCmd = rep.bufferedCommand + cmd + '\n';
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
			// TODO: Re-enable the special `_` value
			//rep.context._ = ret;
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

rep.removeAllListeners('SIGINT');
rep.on('SIGINT', function() {
	rep.outputStream.write(rep.writer('\nCommand interrupt is not implemented yet'));
	rep.close();
});

rep.on('exit', function() {
	console.log('');
});

function writer(obj) {
	if (typeof obj === 'object') {
		if ('repr' in obj) {
			return obj.repr(-1, style);
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
		ast = L.Parser.parse(command).transform(ctx, L.Rules);
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

		result = style.error(e.toString());
		
		if (e.line && e.column) {
			// Parser errors come with line, column, offset, expected,
			// and found properties.
			var pointer = Array(e.column).join(' ') + style.string('^');
			result = '   ' + pointer + '\n' + result;
			str = '';
			rep.setPrompt('>> ');
		} else {
			result += '\n' + style.string(e.stack.replace(/^[^\n]+\n/, ''));
		}

		callback(null, result);
		return;
	}

	try {
		result = (new L.AST.Evaluate({target: ast})).eval(ctx);
	} catch (e) {
		result = style.error(e.toString());
		
		if (e.stack) {
			result += '\n' + style.string(e.stack.replace(/^[^\n]+\n/, ''));
		}
	} finally {
		callback(null, result);
	}
}
