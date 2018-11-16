const log = require('loglevel');
const { NameError } = require('./error');


let resolve = function(ast, bindings) {
	let match = {
		'Bind': function (node, bindings) {
			// Just defer to the other rules...
			node = node.update('template', (template) => {
				[template, bindings] = resolve(template, bindings);
				return template;
			}).update('value', (value) => {
				[value, bindings] = resolve(value, bindings);
				return value;
			});

			return [node, bindings];
		},

		// For Record and Union types, resolve the node's type in the current
		// context. If the type has been previously introduced, raise a type
		// error. Otherwise, add a new binding.

		'RecordType': function (node, bindings) {
			if (node.binding === null) {
				let binding = bindings.resolve(node);

				if (binding) {
					throw new NameError(`reintroduction of ${node.label}`);
				}

				node = node.set('binding', bindings.addBinding(node));
			}

			log.debug(`+ ${node.debugString()}`);
			return [node, bindings];
		},
		'UnionType': function (node, bindings) {
			if (node.binding === null) {
				let binding = bindings.resolve(node);

				if (binding) {
					throw new NameError(`reintroduction of ${node.label}`);
				}

				node = node.set('binding', bindings.addBinding(node));
			}

			log.debug(`+ ${node.debugString()}`);
			return [node, bindings];
		},

		// For Method declarations, resolve the target's type in the current
		// scope. If the type has NOT been previously introduced, raise a
		// type error. Otherwise, set the Method's binding to the target type's
		// binding label and descend into the block and resolve identifiers in
		// the inner scope.
		// TODO: Add a debugString() method to the Method AST class.

		'Method': function (node, bindings) {
			if (node.binding === null) {
				let typeName = node.target.getIn(['tags', 'type']);
				let binding = bindings.resolve({
					label: typeName,
					scope: node.scope
				});

				if (!binding) {
					throw new NameError(`unknown type ${typeName}`);
				}

				// Add a binding for the 'self' value then descend into the block
				node = node.setIn(
					['target', 'binding'], bindings.addBinding(node.target)
				).update('selector', (selector) => {
					return selector.map((item) => {
						if (item._name === 'KeyValuePair') {
							[item, bindings] = resolve(item, bindings);
						}

						return item;
					});
				}).update('block', (block) => {
					[block, bindings] = resolve(block, bindings);
					return block;
				}).set('binding', binding);

				let sc = node.scope.map((sym)=>{return sym.toString();}).toArray().join(',');
				log.log(`= {${typeName}}[${sc}]: ${node.binding}`);
			}

			return [node, bindings];
		},
		'MessageSend': function (node, bindings) {
			return [node, bindings];
		},
		'Invocation': function (node, bindings) {
			node = node.update('args', (args) => {
				return args.map((arg) => {
					[arg, bindings] = resolve(arg, bindings);
					return arg;
				});
			}).update('target', (target) => {
				[target, bindings] = resolve(target, bindings);
				return target;
			});

			return [node, bindings];
		},
		'SymbolLookup': function (node, bindings) {
			node = node.update('target', (target) => {
				[target, bindings] = resolve(target, bindings);
				return target;
			});

			return [node, bindings];
		},
		'SequenceAccess': function (node, bindings) {
			node = node.update('target', (target) => {
				[target, bindings] = resolve(target, bindings);
				return target;
			}).update('terms', (terms) => {
				return terms.map((term) => {
					[term, bindings] = resolve(term, bindings);
					return term;
				});
			});

			return [node, bindings];
		},
		'Immediate': function (node, bindings) {
			node = node.update('target', (target) => {
				[target, bindings] = resolve(target, bindings);
				return target;
			});

			return [node, bindings];
		},
		'PrefixExpression': function (node, bindings) {
			node = node.update('expr', (expr) => {
				[expr, bindings] = resolve(expr, bindings);
				return expr;
			});

			return [node, bindings];
		},
		'InfixExpression': function (node, bindings) {
			node = node.update('lhs', (exp) => {
				[exp, bindings] = resolve(exp, bindings);
				return exp;
			}).update('rhs', (exp) => {
				[exp, bindings] = resolve(exp, bindings);
				return exp;
			});

			return [node, bindings];
		},
		'Block': function (node, bindings) {
			node = node.update('exprs', (exprs) => {
				return exprs.map((exp) => {
					[exp, bindings] = resolve(exp, bindings);
					return exp;
				});
			});

			return [node, bindings];
		},
		'Function': function (node, bindings) {
			node = node.update('template', (template) => {
				// Descend into the template to introduce local names
				[template, bindings] = resolve(template, bindings);
				return template;
			}).update('guard', (exp) => {
				// Descend into the guard to resolve names.
				// TODO: The guard should only resolve local args
				// Probably add another mode in rules to mark localonly
				if (exp) {
					[exp, bindings] = resolve(exp, bindings);
				}

				return exp;
			}).update('block', (block) => {
				// Descend into the block and resolve all the exprs
				[block, bindings] = resolve(block, bindings);
				return block;
			});

			return [node, bindings];
		},
		'HybridFunction': function (node, bindings) {
			node = node.update('predicates', (funcs) => {
				return funcs.map((fn) => {
					[fn, bindings] = resolve(fn, bindings);
					return fn;
				});
			});

			return [node, bindings];
		},
		'List': function (node, bindings) {
			node = node.update('items', (items) => {
				return items.map((item) => {
					[item, bindings] = resolve(item, bindings);
					return item;
				});
			});

			return [node, bindings];
		},
		'Map': function (node, bindings) {
			node = node.update('items', (items) => {
				return items.map((item) => {
					[item, bindings] = resolve(item, bindings);
					return item;
				});
			});

			return [node, bindings];
		},
		'KeyValuePair': function (node, bindings) {
			node = node.update('val', (val) => {
				[val, bindings] = resolve(val, bindings);
				return val;
			});

			return [node, bindings];
		},
		'Identifier': function (node, bindings) {
			// If we get to an Identifier and we aren't in a special mode,
			if (node.binding === null) {
				let binding, mode;

				if (node.getIn(['tags', 'mode']) === 'lvalue') {
					// The identifier is on the left-hand side of a bind operation

					binding = bindings.resolveLocal(node) || bindings.addBinding(node);
					mode = '\u2191';
				} else if (node.getIn(['tags', 'mode']) === 'arg') {
					// The identifier is in a list of arguments to a function or method

					binding = bindings.addBinding(node);
					mode = 'a';
				} else {
					// The identifier is in an expression or on the right-hand
					// side of a bind operation

					binding = bindings.resolveLocal(node);

					if (!binding) {
						// If the identifier didn't resolve locally, then it
						// may be a closure from an outer scope

						// TODO: introduce a new local and mark the ID as a closure
						binding = bindings.resolve(node);
						mode = '\u21A7';
					} else {
						mode = '\u2193';
					}

					if (!binding) {
						throw new NameError(`${node.label} is not defined in the current scope`);
					}
				}

				node = node.set('binding', binding);
				log.debug(`${mode} ${node.debugString()}`);
			}

			return [node, bindings];
		},
		'Symbol': function (node, bindings) {
			return [node, bindings];
		},
		'Record': function (node, bindings) {
			let typebinding = bindings.resolve({
				label: node.getIn(['tags', 'type']),
				scope: node.scope
			});
			console.log(node._name);
			node = node.set('binding', typebinding);
			return [node, bindings];
		},
		'Tuple': function (node, bindings) {
			node = node.update('values', (values) => {
				return values.map((val) => {
					[val, bindings] = resolve(val, bindings);
					return val;
				});
			});

			return [node, bindings];
		}
	};

	if (!ast.getIn(['tags', 'typebinding'])) {
		// Primitive types need type bindings to resolve their type
		ast = ast.setIn(['tags', 'typebinding'],
			bindings.resolve({label: ast._name, scope: ast.scope})
		);
	}

	if (match.hasOwnProperty(ast._name)) {
		return match[ast._name](ast, bindings);
	} else {
		return [ast, bindings];
	}
};

module.exports = resolve;

