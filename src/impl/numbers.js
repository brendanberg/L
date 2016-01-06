var AST = require('../ast');
var dispatch = require('../dispatch');

(function(AST) {
	function make_bool(exp) {
		return new AST.Tag({
			name: exp ? 'True' : 'False',
			tags: {type: 'Bool'}
		});
	};

	module.exports = {
		Integer: {
			"('+':)": dispatch({
				'Integer': function(n) {
					return new AST.Integer({value: this.value + n.value});
				},
				'Rational': function(q) {
					return new AST.Rational({
						numerator: this.value * q.denominator + q.numerator,
						denominator: q.denominator
					});
				},
				'Decimal': function(d) {
					return new AST.Decimal({
						numerator: this.value * Math.pow(10, d.exponent) + d.numerator,
						exponent: d.exponent
					});
				},
				// TODO!
				'Complex': function(z) {
					var exp = new AST.InfixExpression("('+':)", this, z.real);
					return new AST.Complex(exp.eval(this), z.imaginary);
				}
			}),
			"('-')": function() {
				return this.update('value', function(val) { return -val });
			},
			"('-':)": dispatch({
				'Integer': function(n) {
					return this.update('value', function(val) { return val - n.value; });
				},
				'Rational': function(q) {
					return q.set('numerator', this.value * q.denominator - q.numerator);
				},
				'Decimal': function(d) {
					var numerator = this.value * Math.pow(10, d.exponent) - d.numerator;
					return d.set('numerator', numerator);
				},
				// TODO:!
				'Complex': function(z) {
					var exp = new AST.InfixExpression("('-':)", this, z.real);
					return new AST.Complex(exp.eval(this), z.imaginary);
				}
			}),
			"('*':)": dispatch({
				'Integer': function(n) {
					return this.update('value', function (val) { return val * n.value; });
				},
				'Rational': function(q) {
					return q.update('numerator', function (val) { return val * this.value });
				},
				'Decimal': function(d) {
					var numerator = d.numerator + this.value * Math.pow(10, d.exponent);
					return d.set('numerator', numerator);
				},
				// TODO: !!!
				'Complex': function(z) {
					return new AST.Complex(this.value * z.real, z.imaginary);
				}
			}),
			"('/':)": dispatch({
				'Integer': function(n) {
					return this.update('value', function (val) { return val * n.value });
				},
				'Rational': function(q) {
					return new AST.Rational({
						numerator: this.value * q.denominator,
						denominator: q.numerator
					});
				},
				'Decimal': function(d) {
					return d.update('numerator', function (val) {
						return d.numerator + val * Math.pow(10, d.exponent)
					});
				},
				// 'Imaginary': function(j) {
				// 	// (a + 0i) / (0 + di) = (-ad/d^2)i
				// 	return new AST.Complex(this, im);
				// },
				'Complex': function(z) {
					var rational = new AST.Rational(this.value, z.real);
					return new AST.Complex(rational, z.imaginary);
				}
			}),
			"('==':)": dispatch({
				'Integer': function(n) {
					return make_bool(this.value === n.value);
					//TODO: Return method invocation?
				},
				'Rational': function(q) {
					var rat = q.simplify();
					return make_bool(
						rat.denominator === 1 && this.value === rat.numerator
					);
				}
			}),
			"('!=':)": dispatch({
				'Integer': function(n) {
					return make_bool(this.value != n.value);
				},
				'Rational': function(q) {
					var rat = q.simplify();
					return make_bool(
						!(rat.denominator === 1 && this.value === rat.numerator)
					);
				}
			}),
			"('<':)": dispatch({
				'Integer': function(n) {
					return make_bool(this.value < n.value);
				},
				'Rational': function(q) {
					var scaled = this.value * q.denominator;
					return make_bool(scaled < q.numerator);
				}
			}),
			"('>':)": dispatch({
				'Integer': function(n) {
					return make_bool(this.value > n.value);
				},
				'Rational': function(q) {
					var scaled = this.value * q.denominator;
					return make_bool(scaled > q.numerator);
				}
			})
		},
	
		
		// TODO VVVVVV
		Rational: {
			"('+':)": dispatch({
				'Integer': function(n) {
					return this.update('numerator', function (val) {
						return val + n.value * this.denominator;
					});
				},
				'Rational': function(q) {
					return new AST.Rational({
						numerator: this.numerator * q.denominator + this.denominator * q.numerator,
						denominator: this.denominator * q.denominator
					});
				},
				'Decimal': function(d) {
	
				},
				// TODO: !!!
				'Complex': function(z) {
					var exp = new AST.InfixExpression("('+':)", this, z.real)
					return new AST.Complex(exp.eval(this), z.imaginary);
				}
			}),
			"('-':)": dispatch({
				'Integer': function(n) {
					return new AST.Rational(
						this.numerator - n.value * this.denominator, this.denominator
					);
				},
				'Rational': function(q) {
					return new AST.Rational(
						this.numerator * q.denominator - this.denominator * q.numerator,
						this.denominator * q.denominator
					);
				},
				'Decimal': function(d) {
	
				},
				'Imaginary': function(j) {
					return new AST.Complex(this, im);
				},
				'Complex': function(z) {
					var exp = new AST.InfixExpression("('-':)", this, z.real)
					return new AST.Complex(exp.eval(this), z.imaginary);
				}
			}),
			"('*':)": dispatch({
				'Integer': function(n) {
					return new AST.Rational(
						this.numerator * n.value, this.denominator
					);
				},
				'Rational': function(q) {
					return new AST.Rational(
						this.numerator * q.numerator, this.denominator * q.denominator
					);
				},
				'Decimal': function(d) {
	
				},
				'Imaginary': function(j) {
	
				},
				'Complex': function(z) {
	
				}
			}),
			"('/':)": dispatch({
				'Integer': function(n) {
					return new AST.Rational(
						this.numerator, n.value * this.denominator
					);
				},
				'Rational': function(q) {
					return new AST.Rational(
						this.numerator * q.denominator, this.denominator * q.numerator
					);
				},
				'Decimal': function(d) {
	
				},
				'Imaginary': function(j) {
	
				},
				'Complex': function(z) {
	
				}
			})
		},
	
		Decimal: {
			"('+':)": dispatch({
				'Integer': function(n) {
					return new AST.Decimal(
						this.numerator + n.value * Math.pow(10, this.exponent),
						this.exponent
					);
				},
				'Rational': function(q) {
	
				},
				'Decimal': function(d) {
					var num, exp;
					if (this.exponent > d.exponent) {
						num = this.numerator + d.numerator * this.exponent;
						exp = this.exponent
					} else if (this.exponent < d.exponent) {
						num = this.numerator * d.exponent + d.numerator;
						exp = d.exponent;
					} else {
						num = this.numerator + d.numerator;
						exp = this.exponent;
					}
	
					return new AST.Decimal(num, exp);
				},
				'Imaginary': function(j) {
					return new AST.Complex(this, j.magnitude);
				},
				'Complex': function(z) {
					// (this + z.real) + z.imaginary i
					// { \this + \z.real }, \z.imaginary i
					var exp = new AST.InfixExpression("('+':)", this, z.real);
					return new AST.Complex(exp.eval(this), z.imaginary);
				}
			}),
			"('-':)": dispatch({
				'Integer': function(n) {
					return new AST.Decimal(
						this.numerator - n.value * Math.pow(10, this.exponent),
						this.exponent
					);
				},
				'Rational': function(q) {
	
				},
				'Decimal': function(d) {
					var num, exp;
					if (this.exponent > d.exponent) {
						num = this.numerator - d.numerator * this.exponent;
						exp = this.exponent;
					} else if (this.exponent < d.exponent) {
						num = this.numerator * d.exponent - d.numerator;
						exp = d.exponent;
					} else {
						num = this.numerator - d.numerator;
						exp = this.exponent;
					}
	
					return new AST.Decimal
				},
				'Imaginary': function(j) {
					var real = new AST.PrefixExpression("('-':)", this);
					return new AST.Complex(real, j.magnitude);
				},
				'Complex': function(z) {
	
				}
			}),
			"('*':)": dispatch({
				'Integer': function(n) {
					return new AST.Decimal(this.numerator * n.value, this.exponent);
				},
				'Rational': function(q) {
	
				},
				'Decimal': function(d) {
					// 3.2 * 1.4 = (32 / 10) * (14 / 10) = 32 * 14 / 100 
					return new AST.Decimal(
						this.numerator * d.numerator, this.exponent + d.exponent
					);
				},
				'Imaginary': function(j) {
	
				},
				'Complex': function(z) {
	
				}
			}),
			"('/':)": dispatch({
				'Integer': function(n) {
					return new AST.Decimal(this.numerator / n.value, this.exponent);
				},
				'Rational': function(q) {
	
				},
				'Decimal': function(d) {
				},
				'Imaginary': function(j) {
	
				},
				'Complex': function(z) {
	
				}
			})
		},
	
		Complex: {
			"('+':)": dispatch({
				'Integer': function(n) {
				
				},
				'Rational': function(q) {
	
				},
				'Decimal': function(d) {
	
				},
				'Imaginary': function(j) {
					var op = new AST.InfixOperation("('+':)");
					var exp = new AST.InfixExpression(op, this.imaginary, j.magnitude);
					return new AST.Complex(this.real, exp.eval(this));
				},
				'Complex': function(z) {
					var e1 = new AST.InfixExpression("('+':)", this.real, z.real);
					var e2 = new AST.InfixExpression("('+':)", this.imaginary, z.imaginary);
					return new AST.Complex(e1.eval(this), e2.eval(this));
				}
			}),
			"('-':)": dispatch({
				'Integer': function(n) {
				
				},
				'Rational': function(q) {
	
				},
				'Decimal': function(d) {
	
				},
				'Imaginary': function(j) {
	
				},
				'Complex': function(z) {
	
				}
			}),
			"('*':)": dispatch({
				'Integer': function(n) {
				
				},
				'Rational': function(q) {
	
				},
				'Decimal': function(d) {
	
				},
				'Imaginary': function(j) {
	
				},
				'Complex': function(z) {
	
				}
			}),
			"('/':)": dispatch({
				'Integer': function(n) {
				
				},
				'Rational': function(q) {
	
				},
				'Decimal': function(d) {
	
				},
				'Imaginary': function(j) {
	
				},
				'Complex': function(z) {
	
				}
			})
		}
	};
})(AST);
