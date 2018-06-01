const { List, Map } = require('immutable');
const L = require('../src/l');
const chai = require('chai');
const chaiImmutable = require('chai-immutable');
const assert = chai.assert;
const fs = require('fs');
const path = require('path');

chai.use(chaiImmutable);


const load_libraries = () => {
	let ctx = new L.Context();
	let basepath = path.join(path.dirname(fs.realpathSync(__filename)), '../src/lib');
	let filenames = fs.readdirSync(basepath).filter(function(filename) {
		return filename.match(/^[^\.].+\.l$/);
	});
	
	for (let file of filenames) {
		let contents = fs.readFileSync(path.join(basepath, file), 'utf-8');

		let ast = L.Parser.parse(contents).transform(ctx, L.Rules);
		(new L.AST.Immediate({target: ast, args: new L.AST.List()})).eval(ctx);
	}

	return ctx;
};

const test_transcript = (basepath, filename, globals) => {
	let contents = fs.readFileSync(path.join(basepath, filename), 'utf-8');

	// Strip leading characters from each line. If the line matches /^>> /
	// it is the first line of user input. If the line matches /^ - / it is
	// a continuation of user input. Otherwise, it is an expected result.

	let input = [];
	let output = [];
	var is_input = false;

	for (let line of contents.split('\n')) {

		let first = line.match(/^>> (.*)$/);
		
		if (first) {
			input.push(first[1]);
			output.push([]);
			is_input = true;
			continue;
		}

		let rest = line.match(/^ - (.*)$/);

		if (rest) {
			input[input.length - 1] += '\n' + rest[1];
			is_input = true;
			continue;
		}

		if (is_input) {
			is_input = false;
		}

		if (line.length > 0) {
			output[output.length - 1].push(line);
		}
	}

	let ctx = new L.Context({outer: globals});

	it(`correctly evaluates '${filename}'`, () => {
		input.map((elt, idx) => {
			let ast = L.Parser.parse(elt).transform(ctx, L.Rules);
			let result = (new L.AST.Immediate({
				target: ast, args: new L.AST.List()
			})).eval(ctx);

			if (!(output[idx].join('') === '' || output[idx].join('') === '...')) {
				let resultString = result.toString().replace(/\n[ \t\n]*/g, ' ');
				let expected = output[idx].join('\n').replace(/\n[ \t\n]*/g, ' ');
				assert.equal(resultString, expected);
			}
		});
	});
};

let basepath = path.join(path.dirname(fs.realpathSync(__filename)), '/transcripts');
let filenames = fs.readdirSync(basepath).filter(function(filename) {
	return filename.match(/^[^\.].+\.txt$/);
});


describe('Transcripts', () => {
	const globals = load_libraries();

	for (let name of filenames) {
		test_transcript(basepath, name, globals);
	}
});

