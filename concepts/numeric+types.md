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

	+--------------------------------+
	|                                |
	+--------------------------------+
