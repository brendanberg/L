const { Map, List } = require('immutable');
const Type = require('../ast/type');
const Rational = require('../ast/rational');
const Variant = require('../ast/variant');
const dispatch = require('../dispatch');


function make_bool(exp) {
	return new Variant({label: exp ? 'True' : 'False', tags: Map({type: 'Bool'})});
}

let _Complex = new Type({label: 'Complex'});

_Complex.methods = {
	"('+')": function() { return this },
	"('-')": function() {
		return this.update('real', (r) => {
			let method = this.ctx.lookup(r._name).methodForSelector("('-')");
			return method.apply(r, []);
		}).update('imaginary', (j) => {
			let method = this.ctx.lookup(j._name).methodForSelector("('-')");
			return method.apply(j, []);
		});
	},
	'(.real)': function() { return this.real; },
	'(.imaginary)': function() { return this.imaginary; },
	"('+':)": dispatch({
		'Integer': function(n) {
			return this.update('real', (r) => {
				// Invoke r('+': n)
				r.ctx = this.ctx;
				let method = this.ctx.lookup(r._name).methodForSelector("('+':)");
				return method.apply(r, [n]);
			});
		},
		'Complex': function(c) {
			return this.update('real', (r) => {
				// Invoke r('+': c.real)
				r.ctx = this.ctx;
				let method = this.ctx.lookup(r._name).methodForSelector("('+':)");
				return method.apply(r, [c.real]);
			}).update('imaginary', (j) => {
				// invoke j('+': c.imaginary)
				j.ctx = this.ctx;
				let method = this.ctx.lookup(j._name).methodForSelector("('+':)");
				return method.apply(j, [c.imaginary]);
			});
		},
	}),
	"('-':)": dispatch({
		'Integer': function(n) {
			return this.update('real', function(r) {
				// Invoke r('-': n)
				r.ctx = this.ctx;
				let method = this.ctx.lookup(r._name).methodForSelector("('+':)");
				return method.apply(r, [n]);
			});
		},
		'Complex': function(c) {
			return this.update('real', function(r) {
				// Invoke r('-': c.real)
				r.ctx = this.ctx;
				let method = this.ctx.lookup(r._name).methodForSelector("('-':)");
				return method.apply(r, [c.real]);
			}).update('imaginary', function(j) {
				// invoke j('-': c.imaginary)
				j.ctx = this.ctx;
				let method = this.ctx.lookup(j._name).methodForSelector("('-':)");
				return method.apply(j, [c.imaginary]);
			});
		},
	}),
	"('*':)": dispatch({
		// (a+bi)(c+di) = (ac−bd) + (ad+bc)i
		'Integer': function(n) {
			// (a+bi)(c+di) = (ac−bd) + (ad+bc)i
			return this.update('real', (r) => {
				// Invoke n('*': r)
				let method = this.ctx.lookup(n._name).methodForSelector("('*':)");
				return method.apply(n, [r]);
			}).update('imaginary', (j) => {
				// Invoke n('*': j)
				let method = this.ctx.lookup(n._name).methodForSelector("('*':)");
				return method.apply(n, [j]);
			});
		},
		'Complex': function(c) {
			let mul = (lhs, rhs) => {
				let method = this.ctx.lookup(lhs._name).methodForSelector("('*':)")
				return method.apply(lhs, [rhs]);
			};
			let add = (lhs, rhs) => {
				let method = this.ctx.lookup(lhs._name).methodForSelector("('+':)")
				return method.apply(lhs, [rhs]);
			};
			let sub = (lhs, rhs) => {
				let method = this.ctx.lookup(lhs._name).methodForSelector("('-':)")
				return method.apply(lhs, [rhs]);
			};
			
			let real = sub(mul(this.real, c.real), mul(this.imaginary, c.imaginary));
			let imag = add(mul(this.real, c.imaginary), mul(this.imaginary, c.real));

			return this.set('real', real).set('imaginary', imag);
		}
	}),
	"('/':)": dispatch({
		// TODO
		'Integer': function(n) {
			return this;
		}
	}),
	"('//':)": dispatch({
		// TODO
		'Integer': function(n) {
			return this;
		}
	}),
	"('==':)": dispatch({
		'Complex': function(c) {
			// this.real('==': c.real)
			let equals = (lhs, rhs) => {
				let method = this.ctx.lookup(lhs._name).methodForSelector("('==':)")
				return method.apply(lhs, [rhs]);
			};

			let real_eq = equals(this.real, c.real);
			let imag_eq = equals(this.imaginary, c.imaginary);

			return make_bool(real_eq.label === 'True' && imag_eq.label === 'True');
		}
	}),
	"('!=':)": dispatch({
		'Complex': function(c) {
			// this.real('!=': c.real)
			let equals = (lhs, rhs) => {
				let method = this.ctx.lookup(lhs._name).methodForSelector("('!=':)")
				return method.apply(lhs, [rhs]);
			};

			let real_eq = equals(this.real, c.real);
			let imag_eq = equals(this.imaginary, c.imaginary);

			return make_bool(real_eq.label === 'True' && imag_eq.label === 'True');
		}
	}),
};

module.exports = _Complex;			
