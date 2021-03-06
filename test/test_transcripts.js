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

	const basepath = path.join(path.dirname(fs.realpathSync(__filename)), '../src/lib');
	const filenames = fs.readdirSync(basepath).filter(function(filename) {
		return filename.match(/^[^\.].+\.l$/) ? true : false;
	});
	
	for (let file of filenames) {
		let ast, contents = fs.readFileSync(path.join(basepath, file), 'utf-8');

		ast = env.parse(contents);

		if (ast) {
			[_, ctx] = ast.invoke(ctx, false);
		}
	}

	return [env, ctx];
};

const test_transcript = (basepath, filename, environment, context) => {
	let [env, ctx] = create_context();
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

	it(`correctly evaluates '${filename}'`, () => {

		input.map((elt, idx) => {
			let result, ast = env.parse(elt);
			ctx.bindings = env.bindings;
			[result, _] = ast.invoke(ctx, false);

			if (!(output[idx].join('') === '' || output[idx].join('') === '...')) {
				let resultString = result.toString().replace(/\n[ \t\n]*/g, ' ');
				let expected = output[idx].join('\n').replace(/\n[ \t\n]*/g, ' ');
				assert.equal(resultString, expected);
			}
		});
	});
};

let basepath = path.join(path.dirname(fs.realpathSync(__filename)), '/transcripts');
let filenames = fs.readdirSync(basepath).filter((filename) => {
	return filename.match(/^[^\.].+\.txt$/);
});


describe('Transcripts', () => {
	let [env, ctx] = [null, null];//create_context();

	for (let name of filenames) {
		test_transcript(basepath, name, env, ctx);
	}
});

