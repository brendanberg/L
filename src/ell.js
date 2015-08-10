var repl = require('repl');
var L = require('../src/parser');
require('../src/repr');
require('../src/eval');
L.Context = require('../src/context');

var ctx = new L.Context();
var str = '';
var rep;

rep = repl.start({
	ignoreUndefined: true,
	prompt: ">> ",
	eval: eval,
	writer: writer
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
		delimiter: 'cyan'
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
		if ('inspect' in obj) {
			return obj.inspect(fmt.depth, fmt);
		} else {
			return obj.toString();
		}
	} else {
		return obj.toString();
	}
}

function eval(cmd, context, filename, callback) {
	var command = cmd.replace(/^\(/, '').replace(/\n\)$/, '');
	var ast, result;

	try {
		ast = L.Parser.parse(str + command);
		str = '';
		if (rep.prompt === ' - ') {
			rep.prompt = '>> ';
		}
		//.eval(ctx);
	} catch (e) {
		if (e.found === null) {
			rep.prompt = ' - ';
			str = str + command;
			callback(null, undefined);
		} else {
			callback(null, e.message);
		}
		return;
	}

	try {
		result = ast.eval(ctx);	
	} catch (e) {
		console.log(ast.toString());
		result = e.message;
	} finally {
		callback(null, result);
	}
}

