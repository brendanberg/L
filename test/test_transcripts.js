const { List, Set, Map } = require('immutable');
const L = require('../src/l');
const chai = require('chai');
const chaiImmutable = require('chai-immutable');
const assert = chai.assert;
const fs = require('fs');
const path = require('path');

chai.use(chaiImmutable);


const create_context = () => {
	let env = new L.Environment();
	let ctx = new L.Context();
	ctx.loadGlobals(env);

	let basepath = path.join(path.dirname(fs.realpathSync(__filename)), '../src/lib');
	let filenames = fs.readdirSync(basepath).filter(function(filename) {
		return filename.match(/^[^\.].+\.l$/);
	});
	
	let ast;

	for (let file of filenames) {
		let contents = fs.readFileSync(path.join(basepath, file), 'utf-8');

		ast = env.parse(contents);

		ctx.scope = env.scope;
		ast.invoke(ctx);
	}

	return [env, ctx];
};

const test_transcript = (basepath, filename, environment, context) => {
	let contents = fs.readFileSync(path.join(basepath, filename), 'utf-8');

	// Strip leading characters from each line. If the line matches /^>> /
	// it is the first line of user input. If the line matches /^ - / it is
	// a continuation of user input. Otherwise, it is an expected result.

	let input = [];
	let output = [];

	for (let line of contents.split('\n')) {
		let first = line.match(/^>>(.*)$/);
		
		if (first) {
			if (first[1].trim() === '') { continue; }

			input.push(first[1]);
			output.push([]);
			continue;
		}

		let rest = line.match(/^ - (.*)$/);

		if (rest) {
			input[input.length - 1] += '\n' + rest[1];
			continue;
		}

		if (line.length > 0) {
			output[output.length - 1].push(line);
		}
	}

	let ctx = new L.Context();
	ctx.locals = Object.assign({}, context.locals);

	it(`correctly evaluates '${filename}'`, () => {
		input.map((elt, idx) => {
			environment.parser.scope = Set([]);
			let ast = environment.parse(elt);
			let result = ast.invoke(ctx);

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
	let [env, ctx] = create_context();

	for (let name of filenames) {
		test_transcript(basepath, name, env, ctx);
	}
});

