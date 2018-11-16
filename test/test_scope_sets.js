const { List, Set, Map } = require('immutable');
const L = require('../src/l');
const chai = require('chai');
const chaiImmutable = require('chai-immutable');
const assert = chai.assert;
const fs = require('fs');
const path = require('path');

chai.use(chaiImmutable);


describe('Scope Sets', () => {
	let scope = new L.Bindings();
	let context = new L.Context();

	let scope1 = Set([Symbol('a')]);
	let x_out = new L.AST.Identifier({label: 'x', scope: scope1});

	it('looking up an unbound name returns null', () => {
		let binding = scope.resolve(x_out);
		assert.isUndefined(binding);
		let maybe_x = context.get(binding);
		assert.equal(maybe_x, null);
	});

	it('resolving a bound name returns the identical symbol', () => {
		let sym1 = scope.addBinding(x_out);
		let sym2 = scope.resolve(x_out);
		assert.equal(sym1, sym2);
	});

	let value1 = 'v1';

	it('the set() method binds a value to an unbound name', () => {
		let binding = scope.resolve(x_out);
		context.set(binding, value1);
		let maybe_val = context.get(binding);
		assert.equal(value1, maybe_val);
	});

	let value2 = 'v2';

	it('the set() method overwrites a bound name in the same scope', () => {
		let binding = scope.resolve(x_out);
		let maybe_val = context.get(binding);
		assert.equal(value1, maybe_val);
		context.set(binding, value2)
		maybe_val = context.get(binding);
		assert.equal(value2, maybe_val);
	});

	let scope2 = scope1.add(Symbol('b'));
	let x_in = new L.AST.Identifier({label: 'x', scope: scope2});
	let inner = new L.Context(context);

	it('the get() method traverses enclosing scopes to find a bound name', () => {
		let binding = scope.resolve(x_in);
		let maybe_val = inner.get(binding);
		assert.equal(value2, maybe_val);
	});

	let value3 = 'v3';

	it('the set() method shadows a bound name in an inner scope', () => {
		let x_in_b = scope.resolve(x_in);
		inner.setLocal(x_in_b, value3);
		let x_out_b = scope.resolve(x_out);
		let maybe_val = context.get(x_out_b);
		assert.equal(value2, maybe_val);
		maybe_val = inner.get(x_in_b);
		assert.equal(value3, maybe_val);
	});

	let value4 = 'v4';

	it('overwriting an outer name leaves the inner name unmodified', () => {
		let x_in_b = scope.resolve(x_in);
		let x_out_b = scope.resolve(x_out);
		context.set(x_out_b, value4);
		let maybe_val = context.get(x_out_b);
		assert.equal(value4, maybe_val);
		maybe_val = inner.get(x_in_b);
		assert.equal(value3, maybe_val);
	});

	let y_out = new L.AST.Identifier({label: 'y', scope: scope1});

	let y_in = new L.AST.Identifier({label: 'y', scope: scope2});

	let value5 = 'v5';

	it('the get() method respects enclosed scopes', () => {
		let y_out_b = scope.resolve(y_out);
		let y_in_b = scope.resolve(y_in);
		inner.setLocal(y_in_b, value5);
		let maybe_val = inner.get(y_in_b);
		assert.equal(value5, maybe_val);
		maybe_val = context.get(y_out_b);
		assert.equal(null, maybe_val);
	});
});
