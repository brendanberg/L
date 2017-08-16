var pkg = require('../package.json');
var Log = require('log');
let L = {};
let I = require('immutable');

L.version = pkg.version;
L.Skel = require('./skeleton');
L.AST = require('./ast');
L.Parser = require('./parser');
L.Rules = require('./rules');
// repr.js and eval.js modify their imported L and don't export anything.
require('./repr');
require('./transform');
require('./ast-transform');
require('./eval');

L.Context = require('./context');
L.log = new Log('error');

module.exports = L;
