var AST = require('../ast');
var dispatch = require('../dispatch');

(function(AST) {
	AST.Integer.prototype.ctx = {
		'+': dispatch({
			'Integer': function(n) {
				return new AST.Integer(this.value + n.value);
			},
			'Rational': function(q) {
				return new AST.Rational(
					this.value * q.denominator + q.numerator,
					q.denominator
				);
			},
			'Decimal': function(d) {
				return new AST.Decimal(
					this.value * Math.pow(10, d.exponent) + d.numerator,
					d.exponent
				);
			},
			'Imaginary': function(j) {
				return new AST.Complex(this, j.magnitude);
			},
			'Complex': function(z) {
				var op = new AST.InfixOperator('+');
				var exp = new AST.InfixExpression(op, this, z.real);
				return new AST.Complex(exp.eval(this), z.imaginary);
			}
		}),
		'-': dispatch({
			'': function() {
				return new AST.Integer(-this.value);
			},
			'Integer': function(n) {
				return new AST.Integer(this.value - n.value);
			},
			'Rational': function(q) {
				return new AST.Rational(
					this.value * q.denominator - q.numerator, q.denominator
				);
			},
			'Decimal': function(d) {
				return new AST.Decimal(
					this.value * Math.pow(10, d.exponent) - d.numerator,
					d.exponent
				);
			},
			'Imaginary': function(j) {
				return new AST.Complex(this, j.magnitude);
			},
			'Complex': function(z) {
				var op = new AST.InfixOperator('-');
				var exp = new AST.InfixExpression(op, this, z.real);
				return new AST.Complex(exp.eval(this), z.imaginary);
			}
		}),
		'*': dispatch({
			'Integer': function(n) {
				return new AST.Integer(this.value * n.value);
			},
			'Rational': function(q) {
				return new AST.Rational(
					this.value * q.numerator, q.denominator
				);
			},
			'Decimal': function(d) {
				return new AST.Decimal(
					d.numerator + this.value * Math.pow(10, d.exponent),
					d.exponent
				);
			},
			'Imaginary': function(j) {
				var op = new AST.InfixOperator('*');
				var exp = new AST.InfixExpression(op, this.value, j.real);
				return new AST.Complex(exp.eval(this), j.imaginary);
			},
			'Complex': function(z) {
				return new AST.Complex(this.value * z.real, z.imaginary);
			}
		}),
		'/': dispatch({
			'Integer': function(n) {
				return new AST.Rational(this.value, n.value);
			},
			'Rational': function(q) {
				return new AST.Rational(
					this.value * q.denominator, q.numerator
				);
			},
			'Decimal': function(d) {
				return new AST.Decimal(
					d.numerator + this.value * Math.pow(10, d.exponent),
					d.exponent
				);
			},
			'Imaginary': function(j) {
				// (a + 0i) / (0 + di) = (-ad/d^2)i
//				var exp = new AST.InfixExpression(
//					new AST.InfixOperator('/'),
//					new AST.InfixExpression(
//						new AST.InfixOperator('*'), this, j.magnitude
//					),
//						this,
				return new AST.Complex(this, im);
			},
			'Complex': function(z) {
				var rational = new AST.Rational(this.value, z.real);
				return new AST.Complex(rational, z.imaginary);
			}
		}),
		'==': dispatch({
			'Integer': function(n) {
				return new AST.Bool(this.value === n.value);
			},
			'Rational': function(q) {
				var rat = q.simplify();
				return new AST.Bool(
					rat.denominator === 1 && this.value === rat.numerator
				);
			},
		}),
		'<': dispatch({
			'Integer': function(n) {
				return new AST.Bool(this.value < n.value);
			},
			'Rational': function(q) {
				var scaled = this.value * q.denominator;
				return new AST.Bool(scaled < q.numerator);
			}
		}),
		'>': dispatch({
			'Integer': function(n) {
				return new AST.Bool(this.value > n.value);
			},
			'Rational': function(q) {
				var scaled = this.value * q.denominator;
				return new AST.Bool(scaled > q.numerator);
			}
		}),
		'<=': dispatch({
			'Integer': function(n) {
				return new AST.Bool(this.value <= n.value);
			},
			'Rational': function(q) {
				var scaled = this.value * q.denominator;
				return new AST.Bool(scaled <= q.numerator);
			}
		}),
		'>=': dispatch({
			'Integer': function(n) {
				return new AST.Bool(this.value >= n.value);
			},
			'Rational': function(q) {
				var scaled = this.value * q.denominator;
				return new AST.Bool(scaled >= q.numerator);
			}
		}),
		'!=': dispatch({
			'Integer': function(n) {
				return new AST.Bool(this.value != n.value);
			},
			'Rational': function(q) {
				var rat = q.simplify();
				return new AST.Bool(
					!(rat.denominator === 1 && this.value === rat.numerator)
				);
			}
		})
	};

	AST.Rational.prototype.ctx = {
		'+': dispatch({
			'Integer': function(n) {
				return new AST.Rational(
					this.numerator + n.value * this.denominator, this.denominator
				);
			},
			'Rational': function(q) {
				return new AST.Rational(
					this.numerator * q.denominator + this.denominator * q.numerator,
					this.denominator * q.denominator
				);
			},
			'Decimal': function(d) {

			},
			'Imaginary': function(j) {
				return new AST.Complex(this, j.magnitude);
			},
			'Complex': function(z) {
				var op = new AST.InfixOperator('+');
				var exp = new AST.InfixExpression(op, this, z.real)
				return new AST.Complex(exp.eval(this), z.imaginary);
			}
		}),
		'-': dispatch({
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
				var op = new AST.InfixOperator('-');
				var exp = new AST.InfixExpression(op, this, z.real)
				return new AST.Complex(exp.eval(this), z.imaginary);
			}
		}),
		'*': dispatch({
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
		'/': dispatch({
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
	};

	AST.Decimal.prototype.ctx = {
		'+': dispatch({
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
				var exp = new AST.InfixExpression(
					new AST.InfixOperator('+'), this, z.real
				);
				return new AST.Complex(exp.eval(this), z.imaginary);
			}
		}),
		'-': dispatch({
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
				var real = new AST.PrefixExpression(
					new AST.PrefixOperator('-'), this);
				return new AST.Complex(real, j.magnitude);
			},
			'Complex': function(z) {

			}
		}),
		'*': dispatch({
			'Integer': function(n) {
				return new AST.Decimal(this.numerator * n.value, this.exponent);
			},
			'Rational': function(q) {

			},
			'Decimal': function(d) {
				// 3.2 * 1.4 = (32 / 10) * (14 / 10) = 32 * 14 / 100 
				return new AST.Decimal(
					this.numerator * n.numerator, this.exponent + n.exponent
				);
			},
			'Imaginary': function(j) {

			},
			'Complex': function(z) {

			}
		}),
		'/': dispatch({
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
	};

	AST.Imaginary.prototype.ctx = {
		'+': dispatch({
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
		'-': dispatch({
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
		'*': dispatch({
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
		'/': dispatch({
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
	};

	AST.Complex.prototype.ctx = {
		'+': dispatch({
			'Integer': function(n) {
			
			},
			'Rational': function(q) {

			},
			'Decimal': function(d) {

			},
			'Imaginary': function(j) {
				var op = new AST.InfixOperation('+');
				var exp = new AST.InfixExpression(op, this.imaginary, j.magnitude);
				return new AST.Complex(this.real, exp.eval(this));
			},
			'Complex': function(z) {
				var e1 = new AST.InfixExpression(
					new AST.InfixOperator('+'), this.real, z.real
				);
				var e2 = new AST.InfixExpression(
					new AST.InfixOperator('+'), this.imaginary, z.imaginary
				);
				return new AST.Complex(e1.eval(this), e2.eval(this));
			}
		}),
		'-': dispatch({
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
		'*': dispatch({
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
		'/': dispatch({
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
	};
})(AST);
