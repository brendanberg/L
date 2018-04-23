const { Record, Map } = require('immutable');

const _ = null;
const _map = Map({});

let Skel = {
	// Context Nodes
	Block: require('./skeleton/block'),

	// Container Nodes
	List: require('./skeleton/list'),
	Message: require('./skeleton/message'),
	Type: require('./skeleton/type'),

	// Expression Node
	Expression: require('./skeleton/expression'),

	// Terminal Nodes not otherwise in AST
	//Operator: require('./skeleton/operator'),
	Comment: require('./skeleton/comment'),
};

module.exports = Skel;
