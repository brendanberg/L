Numeric Types in the L Programming Language
===========================================

Most programming languages get numeric types wrong.
Typically a language either exposes the underlying architecture,
as in C's int, long, float, double, etc.,
or the abstraction is too high-level, like JavaScript's Number type.

Additionally, arithmetic operations on some types are less intuitive than others.
For example, strict equality tests on floating-point numbers don't always do what you expect because IEEE 754 values are approximations.

In keeping with one of the core design guidelines of __L__,
I wanted to make numeric operations as intuitive as possible.
There are three primitive numeric types in __L__: `integer`, `rational`, and `real`.

The integer type is the most similar to what a programmer familiar with other lanuages.
The only difference is that an __L__ `integer` can store arbitrary sized values without loss of precision.

Internally, integer width is architecture-dependent.
(Typically either 32 or 64 bits.)
It is the implementation's responsibility to promote integer types to a bigint representation when an overflow or underflow occurs.
Likewise, an operation may return a native integer if the resulting value is smaller than the machine's maximum integer size.

Operations with exact results that nevertheless cannot be represented as integers will return values with a `rational` type.
A rational number consists of a numerator and denominator, which are both integers.

Thus, in __L__, the following division operation has a rational result,
as opposed to other languages which would perform either integer division or return a floating point value.

	> frac = 3 / 32
	> frac
	3/32
	> frac type
	rational
	> frac numerator
	3
	> frac denominator
	32


Decimals
--------

Decimals are a special case of rationals.
They are fractions where the denominator is a power of ten.

	> d = (3 / 32) decimal
	> d
	0.09375
	> d type
	decimal
	> d + 5 / 16
	0.40625
	> d numerator
	40625
	> d denominator
	100000

(Do decimals have numerators and denominators?)

	> d standard-form
	4.0625e-1

Decimals can be converted exactly into scientific standard form.
Standard form literals with negative exponents are interpreted as decimal objects.

(Are decimals a special case of exponents?)

	> (1 / 3) decimal
	  ^-----^
	ValueError: rational '1/3' cannot be converted to decimal without loss of precision
	> decimal { approximateValue: 1 / 3 }
	0.333333333333333

Note: message passing is evaluated LTR.
If passing the `decimal` symbol to the rational 1/3 raises a value error,
there needs to be a way to specify that a decimal approximation is acceptable.
I'm considering one of two ways.
Either `(1 / 3) (decimal approximation)` or `decimal { approximateValue: 1/3 }`

A decimal behaves like any other rational, but can only have a power of ten as the denominator.
Despite their similar behavior,
rationals and decimals are implemented slightly differently internally.
Instead of using an integer to represent the actual value of the denominator,
decimals use an integer to represent the denominator's exponent.


Real Numbers, or approximations thereof
---------------------------------------

The floating point data type is an arbitrary precision approximation of a real number.

	> approxima0.09375 real
	0.09375 real
	> 0.09375 real
	0.09375 real
	
	> 3.141592653589793 rational
	3141592653589793/1000000000000000
	> 3.141592653589793 rational { maximumDenominator: 1000 }
	355/113

As you can see, floating-point values can be represented as rationals
without loss of precision by using very large denominators.
If a denominator is so large it becomes unwieldy,
a `maximumDenominator:` message may be sent to the rational
to ___ at the expense of lost precision.
