var repl = require('repl');
var L = require('../src/parser');
require('../src/repr');
require('../src/eval');
L.Context = require('../src/context');

var ctx = new L.Context();
var str = '';
var rep;

rep = repl.start({
	prompt: ">> ",
	eval: eval,
	ignoreUndefined: true
});

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

