#! /usr/bin/env node

const { List } = require('immutable');
const repl = require('repl');
const L = require('./l');
const fs = require('fs');
const path = require('path');
const util = require('util');
const style = require('./format');

const loadSourceFile = (basepath, filename) => {
	let ast, contents = fs.readFileSync(path.join(basepath, filename), 'utf-8');

	try {
		ast = L.Parser.parse(contents).transform(ctx, L.Rules);
	} catch (e) {
		let result = e.toString();

		if (e.line && e.column) {
			result += `\nline ${e.line}, column ${e.column}`;
		} else {
			result += `\n ${e.stack.replace(/^[^\n]+\n/, '')}`;
		}

		L.log.warn(style.comment(result));
	}

	if (ast) {
		(new L.AST.Immediate({target: ast, args: new L.AST.List()}).eval(ctx));
	}
};


// ---------------------------------------------------------------------------
// Create the initial context and load built-in library
// ---------------------------------------------------------------------------

let ctx = new L.Context();


const basepath = path.join(path.dirname(fs.realpathSync(__filename)), '/lib');
const filenames = fs.readdirSync(basepath).filter(function(filename) {
	return filename.match(/^[^\.].+\.l$/) ? true : false;
});

for (let filename of filenames) {
	loadSourceFile(basepath, filename);
}


// ---------------------------------------------------------------------------
// Instantiate and configure the interactive shell
// ---------------------------------------------------------------------------

process.stdout.write(style.operator('The L Programming Language, Meta.L v' + L.version + '\n'));
process.stdout.write('\033]0;Meta.L\007');

const rep = repl.start({
	ignoreUndefined: true,
	prompt: ">> ",
	eval: eval,
	writer: writer
});

let bufferedCommand = '';

rep.clearBufferedCommand = () => {
	bufferedCommand = '';
};

rep.invokeCommand = function(args) {
	const command = this.commands[args[0]];

	if (command) {
		return command.action.apply(this, args.slice(1)) || '';
	}
	return null;
}

rep.commands = {};

rep.defineCommand('help', {
	help: 'Print this help message',
	action: function() {
		const names = Object.keys(this.commands).sort();
		const longestNameLength = names.reduce(
			(max, name) => Math.max(max, name.length),
			0
		);
		for (let name of names) {
			const cmd = this.commands[name];
			const spaces = ' '.repeat(longestNameLength - name.length + 3);
			const line = `${style.important(name)}${cmd.help ? spaces + cmd.help : ''}\n`;
			this.outputStream.write(line);
		}
	}
});

rep.defineCommand('quit', {
	help: 'Quit the interactive shell',
	action: function() {
		this.close();
	}
});

rep.defineCommand('break', {
	help: 'Break out of the current nested statement and clear buffered input',
	action: function() {
		rep.clearBufferedCommand();
		rep.setPrompt('>> ');
		rep.displayPrompt();
	}
});

rep.defineCommand('clear', {
	help: 'Clear the session\'s context',
	action: function() {
		this.clearBufferedCommand();
		ctx = new L.Context();
		return 'Successfully cleared the session\'s context\n';
	}
});

rep.defineCommand('log', {
	help: 'Set the logging level',
	action: function(level) {
		if (level) {
			L.log.setLevel(level);
			return `Set logging level to '${ level }'\n`;
		}
	}
});

rep.defineCommand('load', {
	help: 'Load an L source file into the current session',
	action: function(filename) {
		loadSourceFile(path.dirname(fs.realpathSync(__filename)), filename);
	}
});

rep.defineCommand('save', {
	help: 'Save all evaluated commands in the current session into a file',
	action: function(filename) {
		console.log(this.lines);
	}
});

rep.removeAllListeners('line');
rep.on('line', (cmd) => {
	L.log.debug(style.comment('line %j'), cmd);
	cmd = trimWhitespace(cmd);

	// Check to see if a REPL keyword was used. If it returns true,
	// display next prompt and return.
	if (cmd && cmd.match(/^#!/)) {
		const match = cmd.match(/^#!\s*(.*)$/),
			command = match && match[1].split(/\s+/);

		if (command) {
			const args = command.filter((x) => { return x.length; }).map((val) => {
				if (isNaN(val)) { return val; }
				else { return parseFloat(val); }
			});

			const result = rep.invokeCommand(args);

			if (result !== null) {
				rep.outputStream.write(style.comment(rep.writer(result)));
				finish(null);
				return;
			} else {
				rep.outputStream.write('Invalid REPL command\n');
			}
		}
	}

	const evalCmd = bufferedCommand + cmd + '\n';
	L.log.debug(style.comment('eval %j'), evalCmd);
	rep.eval(evalCmd, rep.context, 'repl', finish);

	function finish(e, ret) {
		if (e) {
			if (e instanceof repl.Recoverable) {
				// Start buffering data when the parser is still expecting
				// closing delimiters:
				// >> (x) -> {
				//  -   x * 2
				//  - }
				bufferedCommand += cmd + '\n';
				const padding = '  '.repeat(depth(bufferedCommand));

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

	function trimWhitespace(cmd) {
		const trimmer = /^\s*(.+)\s*$/m,
			matches = trimmer.exec(cmd);
	
		if (matches && matches.length === 2) {
			return matches[1];
		}

		return '';
	}
});

rep.removeAllListeners('SIGINT');
rep.on('SIGINT', function() {
	if (bufferedCommand.length > 0) {
		rep.clearBufferedCommand();
		rep.setPrompt('>> ');
		rep.displayPrompt();
	} else {
		rep.outputStream.write('\nTo exit, press Ctrl-D or type !exit\n');
		rep.displayPrompt();
	}
});

rep.on('exit', function() {
	rep.outputStream.write(rep.writer('\n'));
});


// ---------------------------------------------------------------------------
// Override evaluation hooks to implement Meta.L instead of JavaScript
// ---------------------------------------------------------------------------

function depth(cmd) {
	// TODO: Figure out how to attach this to the top AST node?
	const dn = cmd.match(/{{|{[^{]|\[|\(|<</g), dnlen = dn ? dn.length : 0;
	const up = cmd.match(/}}|[^}]}|\]|\)|>>/g), uplen = up ? up.length : 0;

	return Math.max(dnlen - uplen, 0);
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

function eval(cmd, context, filename, finish) {
	// The node repl module before 0.10.26 parenthesized
	// the command passed to the eval function. By version
	// 0.12.4, it didn't parenthesize commands.
	// ---
	// Trailing newlines are verboten.
	const command = cmd.replace(/^\((.*)\)$/, '$1').replace(/\n$/, '');
	let ast, result;

	if (command.trim() === '') {
		rep.displayPrompt();
		return;
	}

	try {
		ast = L.Parser.parse(command).transform(ctx, L.Rules);
		rep.setPrompt('>> ');
	} catch (e) {
		if (e.found == null) {
			L.log.debug(e.toString());
			L.log.debug(style.comment(e.stack.replace(/^[^\n]+\n/, '')));

			rep.setPrompt(' - ');
			finish(new repl.Recoverable('Unexpected end of input'), '');
			return;
		}

		result = style.error(e.toString());
		
		if (e.line && e.column) {
			// Parser errors come with line, column, offset, expected,
			// and found properties.
			const pointer = ' '.repeat(e.column) + style.string('^');
			result = '   ' + pointer + '\n' + result;
			rep.clearBufferedCommand();
			rep.setPrompt('>> ');
		} else {
			result += '\n' + style.string(e.stack.replace(/^[^\n]+\n/, ''));
		}

		finish(null, result);
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
		finish(null, result);
	}
}
