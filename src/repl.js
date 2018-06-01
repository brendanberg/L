#! /usr/bin/env node

const { List } = require('immutable');
const repl = require('repl');
const L = require('./l');
const fs = require('fs');
const path = require('path');
let util = require('util');

let ctx = new L.Context();


let basepath = path.join(path.dirname(fs.realpathSync(__filename)), '/lib');
let filenames = fs.readdirSync(basepath).filter(function(filename) {
	return filename.match(/^[^\.].+\.l$/) ? true : false;
});
let contents, ast = null;

const style = require('./format');


for (let i = 0, len = filenames.length; i < len; i++) {
	let contents = fs.readFileSync(path.join(basepath, filenames[i]), 'utf-8');

	try {
		let ast = L.Parser.parse(contents).transform(ctx, L.Rules);
	} catch (e) {
		var result = e.toString();
		
		if (e.line && e.column) {
			result += '\nline ' + e.line + ', column ' + e.column;
		} else {
			result += '\n' + e.stack.replace(/^[^\n]+\n/, '');
		}

		L.log.debug(result);
	}

	if (ast) {
		(new L.AST.Immediate({target: ast, args: new L.AST.List()})).eval(ctx);
	}
}

process.stdout.write(style.operator('The L Programming Language, Meta.L v' + L.version + '\n'));
process.stdout.write('\033]0;Meta.L\007');

let rep = repl.start({
	ignoreUndefined: true,
	prompt: ">> ",
	eval: eval,
	writer: writer
});

let bufferedCommand = '';

rep.clearBufferedCommand = () => {
	bufferedCommand = '';
};

rep.removeAllListeners('line');
rep.on('line', (cmd) => {
	L.log.debug('line %j', cmd);
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
		var evalCmd = bufferedCommand + cmd + '\n';
		L.log.debug('eval %j', evalCmd);
		rep.eval(evalCmd, rep.context, 'repl', finish);
	} else {
		finish(null);
	}

	function finish(e, ret) {
		L.log.debug('finish', e, ret);

		// If error was SyntaxError and not JSON.parse error
		if (e) {
			if (e instanceof repl.Recoverable) {
				// Start buffering data like that:
				// {
				// ...	x: 1
				// ... }
				bufferedCommand += cmd + '\n';
				let padding = Array(depth(bufferedCommand)).fill('  ').join('');

				rep.displayPrompt();
				rep.write(padding);
				rep.line = padding;
				rep.cursor = padding.length;
				return;
			} else {
				rep._domain.emit('error', e);
			}
		}

		// Clear buffer if no SyntaxErrors
		rep.clearBufferedCommand();

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
	rep.outputStream.write(rep.writer('\n'));
});

function depth(cmd) {
	// TODO: Figure out how to attach this to the top AST node?
	let dn = cmd.match(/{{|{[^{]|\[|\(|<</g);
	let up = cmd.match(/}}|[^}]}|\]|\)|>>/g);

	let dnlen = dn ? dn.length : 0;
	let uplen = up ? up.length : 0;

	return dnlen - uplen;
}

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
	// TODO: move this to online handler
	if (level) {
		L.log.setLevel(level[1]);
		process.stdout.write("Set logging level to '" + level[1] + "'\n");
		rep.displayPrompt();
		return;
	}

	if (command.trim() === '') {
		//callback(null, undefined);
		rep.displayPrompt();
		return;
	}

	try {
		ast = L.Parser.parse(command).transform(ctx, L.Rules);
		rep.setPrompt('>> ');
	} catch (e) {
		if (e.found == null) {
			L.log.debug(e.toString());
			L.log.debug(e.stack.replace(/^[^\n]+\n/, ''));

			rep.setPrompt(' - ');
			callback(new repl.Recoverable('Unexpected end of input'), '');
			return;
		}

		result = style.error(e.toString());
		
		if (e.line && e.column) {
			// Parser errors come with line, column, offset, expected,
			// and found properties.
			var pointer = Array(e.column).join(' ') + style.string('^');
			result = '   ' + pointer + '\n' + result;
			rep.clearBufferedCommand();
			rep.setPrompt('>> ');
		} else {
			result += '\n' + style.string(e.stack.replace(/^[^\n]+\n/, ''));
		}

		callback(null, result);
		return;
	}

	try {
		result = (new L.AST.Immediate({
			target: ast, args: List([])
		})).eval(ctx);
	} catch (e) {
		result = style.error(e.toString());
		
		if (e.stack) {
			result += '\n' + style.string(e.stack.replace(/^[^\n]+\n/, ''));
		}
	} finally {
		callback(null, result);
	}
}
