/*
   Identifier List AST Node
*/

const { Map, List, Record } = require('immutable');

const _ = null;
const _list = List([]);
const _map = Map({});

const IdentifierList = Record({idents: _list, tags: _map}, 'IdentifierList');

module.exports = IdentifierList;

