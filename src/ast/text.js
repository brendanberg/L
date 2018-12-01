/*
   Text AST node
 */

const { List, Map, Record } = require('immutable');
const punycode = require('punycode');
const _ = null;
const _map = Map({});
const _list = List([]);


let Text = Record({value: _, scope: _, tags: _map}, 'Text');

Text.prototype.toString = function() {
	// Returns a quoted, escaped string suitable for input into the parser
	// By default we use single quotes. We replace newline, tab, and backslash
	// characters with their escaped selves. If the string contains both a
	// single and double quote character, we escape any instances of single
	// quotes and return the string. If the only unescaped quote character in
	// the string is single quote, we escape any instances of double quotes
	// and use double quotes as delimiters.

	let repr = punycode.ucs2.encode(this.value).replace(/[\n\t\\]/g, function(match) {
		return ({
			"\n": "\\n",
			"\t": "\\t",
			"\\": "\\\\"
		})[match];
	});

	if (repr.indexOf("'") !== -1) {
		if (repr.indexOf('"') !== -1) {
			// String contains both ' and ".
			return "'" + repr.replace(/'/g, "\\'") + "'";
		} else {
			return '"' + repr.replace(/"/g, '\\"') + '"';
		}
	} else {
        return "'" + repr + "'";
    }
};

Text.prototype.repr = function(depth, style) {
    return style.string(this.toString());
};

Text.prototype.eval = function(ctx) {
    return [this, ctx];
};

Text.prototype.transform = function(func) {
    return func(this);
};

module.exports = Text;

