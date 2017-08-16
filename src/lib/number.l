#-

-#

NumberType : Protocol([
	(...) -> Blah
])

# Either define numbers as nested variants:
Real :: < Integer | Rational (Integer, Integer) | Scientific (Integer, Integer) >
Number :: < Real | Complex (Real, Real) >

@(Integer) => { Real.Integer }
@(Rational) => { Real.Rational }
@(Scientific) => { Real.Scientific }
@(Complex) => { Number.Complex }


# What about this syntax:
#-
Real < Integer | Rational | Scientific >
Number < Real | Complex >

Number :: <
	Real <
		Integer
		Rational < numerator: Integer, denominator: Integer >
		Scientific < significand: Integer, mantissa: Integer >
	>
	Complex < real: Number, imaginary: Number >
>
-#

Integer x ('==': y) -> {
	y (match:) {
		Integer -> { #- Sum of x and y -# }
		Rational(n, d) -> {
			#---
			N.B: Rationals are always simplified internally?

			gcd :: { #- Greatest common denominator -# }
			simpl :: Rational(n / gcd, d / gcd)

			simpl.denominator == 1 /\ x == simpl.numerator
			#---
			d == 1 /\ x == n
			-#
		}
		Scientific(i, e) -> { Scientific(i, e) }
	}
}

Integer x ('!=': y) -> { !(x == y) }

Integer x ('>': y) -> {
	y (match:) {
		Integer -> { #- internal comparison -# }
		Rational(n, d) -> { x * d > n }
		Scientific(i, e) -> { Scientific(i, e) }
	}
}

Integer x ('<': y) -> {
}

Integer x ('>=': y) -> { !(x < y) }

Integer x ('<=': y) -> { !(x > y) }

Integer x ('+': y) -> {
	y (match:) {
		Integer -> { #- internal addition -# }
		Rational(n, d) -> { Rational(x * d + n, d) }
		Scientific(i, e) -> { Scientific(i, e) }
	}
}

Integer x ('-': y) -> {
	y (match:) {
		Integer -> { }
		Rational(n, d) -> { Rational(x * d - n, d) }
		Scientific(i, e) -> { Scientific(i, e) }
	}
}

Integer x ('*': y) -> {
	y (match:) {
		Integer -> { }
		Rational(n, d) -> { Rational(x * n, d) }
		Scientific(i, e) -> { Scientific(i, e) }
	}
}

Integer x ('/': y) -> {
	y (match:) {
		Integer -> { Rational(x, y) }
		Rational(n, d) -> { Rational(x * d, n) }
		Scientific(i, e) -> { Scientific(i, e) }
	}
}

Integer x ('**': y) -> {
	y (match:) {
		Integer -> { }
		Rational(n, d) -> { }
		Scientific(i, e) -> { Scientific(i, e) }
	}
}

Rational (nx, dx) ('==': y) -> {
	y (match:) {
		Integer -> { y == x }
		Rational(ny, dy) -> { nx == ny /\ dx == dy }
		Scientific(i, e) -> { Scientific(i, e) }
	}
}

Rational x ('!=': y) -> { !(x == y) }

Rational (nx, dx) ('>': y) -> {
	y (match:) {
		Integer -> { nx > dx * y }
		Rational(ny, dy) -> { nx * dy > ny * dx }
		Scientific(i, e) -> { Scientific(i, e) }
	}
}

Rational (nx, dx) ('<': y) -> {
	y (match:) {
		Integer -> { nx < dx * y }
		Rational(ny, dy) -> { nx * dy < ny * dx }
		Scientific(i, e) -> { Scientific(i, e) }
	}
}

Rational x ('>=': y) -> { !(x < y) }

Rational x ('<=': y) -> { !(x > y) }

Rational (nx, dx) ('+': y) -> { }

Rational (nx, dx) ('-': y) -> { }

Rational (nx, dx) ('*': y) -> { }

Rational (nx, dx) ('/': y) -> { }

Scientific (xi, xe) ('==': y) -> { }

Scientific x ('!=': y) -> { !(x == y) }

Scientific (xi, xe) ('>': y) -> { }

Scientific (xi, xe) ('<': y) -> { }

Scientific x ('>=': y) -> { !(x < y) }

Scientific x ('<=': y) -> { !(x > y) }

Scientific (xi, xe) ('+': y) -> { }

Scientific (xi, xe) ('-': y) -> { }

Scientific (xi, xe) ('*': y) -> { }

Scientific (xi, xe) ('/': y) -> { }

