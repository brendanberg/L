#! /usr/bin/env node

const { List, Set } = require('immutable');
const repl = require('repl');
const L = require('./l');
const fs = require('fs');
const path = require('path');
const util = require('util');
const style = require('./format');
const config = require('config');

const input_start = config.get('repl.prompt.input_start');
const input_more = config.get('repl.prompt.input_more');

const env = new L.Environment();

const loadSourceFile = (basepath, filename) => {
	let ast, contents = fs.readFileSync(path.join(basepath, filename), 'utf-8');

	try {
		ast = env.parse(contents);
	} catch (e) {
		let result = e.toString();

		if (e.line && e.column) {
			result += `\nline ${e.line}, column ${e.column}`;
		} else if (e.stack) {
			result += `\n ${e.stack.replace(/^[^\n]+\n/, '')}`;
		}

		L.log.warn(style.comment(result));
	}

	if (ast) {
		[_, ctx] = ast.invoke(ctx, false);
	}
};


// ---------------------------------------------------------------------------
// Create the initial context and load built-in library
// ---------------------------------------------------------------------------

let ctx = new L.Context(null, {});
ctx.loadGlobals(env);

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

// Write the welcome banner. The banner can be configured in the REPL config
// file by providing a string or array of strings for the key 'banner'. The
// banner string can use the ES6 interpolation `${variable}` syntax and
// reference `welcome`, `version`, and `help` strings defined below. The
// default banner string is `"${welcome}, ${version}\n${help}\n"`.

String.prototype.interpolate = function(params) {
	const names = Object.keys(params);
	const vals = Object.values(params);
	return new Function(...names, `return \`${this}\`;`)(...vals);
}

const banner_cfg = config.get('repl.banner');
const banner = Array.isArray(banner_cfg) ? banner_cfg.join('') : banner_cfg;

process.stdout.write(banner.interpolate({
	welcome: 'The L Programming Language',
	version: `Meta.L v ${L.version}`,
	help: 'Type "#! help" for more information'
}));

// Set the window title
process.stdout.write('\033]0;Meta.L\007');

//process.stdout.write(`${prefix}${config.repl.welcome}${suffix}`);
const rep = repl.start({
	ignoreUndefined: true,
	prompt: input_start,
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
		rep.setPrompt(input_start);
		rep.displayPrompt();
	}
});

rep.defineCommand('clear', {
	help: 'Clear the session\'s context',
	action: function() {
		this.clearBufferedCommand();
		ctx = (new L.Context()).loadGlobals();
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
		L.log.debug(this.lines);
	}
});

rep.removeAllListeners('line');
rep.on('line', (cmd) => {
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
				let line = `${command} is not a recognized shell command\n`;
				rep.outputStream.write(rep.writer(style.error(line)));
				rep.displayPrompt();
				return;
			}
		}
	}

	const evalCmd = bufferedCommand + cmd + '\n';
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
		rep.setPrompt(input_start);
		rep.displayPrompt();
	} else {
		rep.outputStream.write('\n   To exit, press Ctrl-D or type #!quit\n');
		rep.displayPrompt();
	}
});

rep.on('exit', function() {
	rep.outputStream.write('\n');
});


// ---------------------------------------------------------------------------
// Override evaluation hooks to speak Meta.L instead of JavaScript
// ---------------------------------------------------------------------------

function depth(cmd) {
	// TODO: Figure out how to attach this to the top AST node?
	const dn = cmd.match(/{{|{[^{]|\[|\(|<</g), dnlen = dn ? dn.length : 0;
	const up = cmd.match(/}}|[^}]}|\]|\)|>>/g), uplen = up ? up.length : 0;

	return Math.max(dnlen - uplen, 0);
}

function writer(obj) {
	const ok = config.get('repl.prompt.output_ok');
	const error = config.get('repl.prompt.output_error');

	if (typeof obj === 'object') {
		if ('repr' in obj && obj._name === 'Error') {
			return error + obj.repr(-1, style).replace(/\n/g, '\n' + error);
		} else if ('repr' in obj) {
			return ok + obj.repr(-1, style).replace(/\n/g, '\n' + ok);
		} else {
			return error + obj.toString().replace(/\n/g, '\n' + error);
		}
	} else {
		return error + obj.toString().replace(/\n/g, '\n' + error);
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
		ast = env.parse(command);
		rep.setPrompt(input_start);
	} catch (e) {
		if (e.hasOwnProperty('found') && e.found == null) {
			/*
			L.log.debug(e.toString());

			if (e.stack) {
				L.log.debug(style.comment(e.stack.replace(/^[^\n]+\n/, '')));
			}
			*/

			rep.setPrompt(input_more);
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
			rep.setPrompt(input_start);
		} else if (e.stack) {
			result += '\n' + style.string(e.stack.replace(/^[^\n]+\n/, ''));
		}

		finish(null, result);
		return;
	}

	try {
		// TODO: Bindings needs to be kept at the root context???
		ctx.bindings = env.bindings;
		[result, ctx] = ast.invoke(ctx, false);
	} catch (e) {
		result = style.error(e.toString());
		
		if (e.stack) {
			result += '\n' + style.string(e.stack.replace(/^[^\n]+\n/, ''));
		}
	} finally {
		finish(null, result);
	}
}
