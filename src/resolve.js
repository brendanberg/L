const log = require('loglevel');
const { Map, List } = require('immutable');
const { NameError } = require('./error');


const first_pass = function(ast, bindings) {
	let match = {
		'Bind': function (node, bindings) {
			// Just defer to the other rules...
			node = node.update('value', (value) => {
				[value, bindings] = first_pass(value, bindings);
				return value;
			}).update('template', (template) => {
				[template, bindings] = first_pass(template, bindings);
				return template;
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
							let val;
							[val, bindings] = first_pass(item.val, bindings);
							// We set the binding to false so the second pass 
							// doesn't choke. This is ok because no one ever
							// resolves the binding on the selector labels.
							item = item.set('val', val).update('key', (key) => {
								if (key._name === 'Identifier') {
									return key.set('binding', false);
								}
								return key;
							});
						}

						return item;
					});
				}).update('block', (block) => {
					[block, bindings] = first_pass(block, bindings);
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
		'Call': function (node, bindings) {
			node = node.update('args', (args) => {
				return args.map((arg) => {
					[arg, bindings] = first_pass(arg, bindings);
					return arg;
				});
			}).update('target', (target) => {
				[target, bindings] = first_pass(target, bindings);
				return target;
			});

			return [node, bindings];
		},
		'SymbolLookup': function (node, bindings) {
			node = node.update('target', (target) => {
				[target, bindings] = first_pass(target, bindings);
				return target;
			});

			return [node, bindings];
		},
		'SequenceAccess': function (node, bindings) {
			node = node.update('target', (target) => {
				[target, bindings] = first_pass(target, bindings);
				return target;
			}).update('terms', (terms) => {
				return terms.map((term) => {
					[term, bindings] = first_pass(term, bindings);
					return term;
				});
			});

			return [node, bindings];
		},
		'Immediate': function (node, bindings) {
			node = node.update('target', (target) => {
				[target, bindings] = first_pass(target, bindings);
				return target;
			});

			return [node, bindings];
		},
		'PrefixExpression': function (node, bindings) {
			node = node.update('expr', (expr) => {
				[expr, bindings] = first_pass(expr, bindings);
				return expr;
			});

			return [node, bindings];
		},
		'InfixExpression': function (node, bindings) {
			node = node.update('lhs', (exp) => {
				[exp, bindings] = first_pass(exp, bindings);
				return exp;
			}).update('rhs', (exp) => {
				[exp, bindings] = first_pass(exp, bindings);
				return exp;
			});

			return [node, bindings];
		},
		'Block': function (node, bindings) {
			node = node.update('exprs', (exprs) => {
				return exprs.map((exp) => {
					[exp, bindings] = first_pass(exp, bindings);
					return exp;
				});
			});

			return [node, bindings];
		},
		'Function': function (node, bindings) {
			node = node.update('template', (template) => {
				// Descend into the template to introduce local names
				[template, bindings] = first_pass(template, bindings);
				return template;
			}).update('guard', (exp) => {
				// Descend into the guard to resolve names.
				// TODO: The guard should only resolve local args
				// Probably add another mode in rules to mark localonly
				if (exp) {
					[exp, bindings] = first_pass(exp, bindings);
				}

				return exp;
			}).update('block', (block) => {
				// Descend into the block and resolve all the exprs
				[block, bindings] = first_pass(block, bindings);
				return block;
			});

			return [node, bindings];
		},
		'HybridFunction': function (node, bindings) {
			node = node.update('predicates', (funcs) => {
				return funcs.map((fn) => {
					[fn, bindings] = first_pass(fn, bindings);
					return fn;
				});
			});

			return [node, bindings];
		},
		'List': function (node, bindings) {
			node = node.update('items', (items) => {
				return items.map((item) => {
					[item, bindings] = first_pass(item, bindings);
					return item;
				});
			});

			return [node, bindings];
		},
		'Map': function (node, bindings) {
			node = node.update('items', (items) => {
				return items.map((item) => {
					[item, bindings] = first_pass(item, bindings);
					return item;
				});
			});

			return [node, bindings];
		},
		'KeyValuePair': function (node, bindings) {
			node = node.update('val', (val) => {
				[val, bindings] = first_pass(val, bindings);
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
				} else if (node.getIn(['tags', 'mode']) === 'immediate') {
					binding = bindings.resolveOuter(node);
					mode = '\u2193';
				} else {
					// The identifier is in an expression or on the right-hand
					// side of a bind operation

					binding = bindings.resolveLocal(node);

					// TODO: This whole step might be better done in the second pass.
					if (!binding) {
						// If the identifier didn't resolve locally, then it
						// may be a closure from an outer scope.
						let closure = bindings.resolve(node);

						if (closure) {
							binding = bindings.addBinding(node, closure);
							mode = '\u21A7';
						} else {
							binding = null;
							mode = '?';
						}
					} else {
						mode = '\u2193';
					}
					// Let it slide until we clean up after traversing the block first.

					/*
					if (!binding) {
						throw new NameError(`${node.label} is not defined in the current scope`);
					}
					*/
				}

				node = node.set('binding', binding);
				log.debug(`${mode} ${node.debugString()}`);
			}

			return [node, bindings];
		},
		'Symbol': function (node, bindings) {
			if (!node.hasIn(['tags', 'typebinding'])) {
				let typebinding = bindings.resolve({
					label: node.getIn(['tags', 'type']),
					scope: node.scope
				});

				node = node.setIn(['tags', 'typebinding'], typebinding);
			}

			return [node, bindings];
		},
		'Record': function (node, bindings) {
			if (!node.hasIn(['tags', 'typebinding'])) {
				let typebinding = bindings.resolve({
					label: node.getIn(['tags', 'type']),
					scope: node.scope
				});

				node = node.setIn(['tags', 'typebinding'], typebinding);
			}

			return [node, bindings];
		},
		'Tuple': function (node, bindings) {
			node = node.update('values', (values) => {
				return values.map((val) => {
					[val, bindings] = first_pass(val, bindings);
					return val;
				});
			});

			return [node, bindings];
		}
	};

	if (match.hasOwnProperty(ast._name)) {
		[ast, bindings] = match[ast._name](ast, bindings);
	}	

	if (!ast.getIn(['tags', 'typebinding'])) {
		// Primitive types need type bindings to resolve their type
		ast = ast.setIn(['tags', 'typebinding'],
			bindings.resolve({label: ast._name, scope: ast.scope})
		);
	}

	return [ast, bindings];
};

const resolve = function(ast, bindings) {
	[ast, bindings] = first_pass(ast, bindings);

	// Resolve any unbound closures.
	log.debug('---');
	ast = ast.transform((elt) => {
		if (elt._name === 'Identifier' && elt.binding == null) {
			let binding, closure = bindings.resolveOuter(elt);

			if (closure) {
				binding = bindings.resolveLocal(elt) || bindings.addBinding(elt, closure);
			} else {
				throw new NameError(`${elt.label} is not defined in the current scope`);
			}

			elt = elt.set('binding', binding);
			log.debug(`\u21A7 ${elt.debugString()}`);
			return elt;
		} else {
			return elt;
		}
	}).transform((elt) => {
		if (elt._name === 'Block') {
			elt = elt.update('closures', (closures) => {
				return closures.merge(Map(bindings.getClosures(elt.scope)));
			});
			return elt;
		} else {
			return elt;
		}
	});

	return [ast, bindings];
};

module.exports = resolve;

