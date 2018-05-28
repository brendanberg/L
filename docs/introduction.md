# Introduction to the 🅛 Programming Language

Hello.

## Syntax

A program in __L__ is a list of expressions.
Expressions may be atomic terms like the literal number `1` or text `'hello'`,
compound expressions made up of multiple individual terms like the product `6 * 7`,
or containers of other expressions like the list `[1, 2, 3]` or block `{ x + y }`.

__L__ has five container structures that are enclosed by matched open and close symbols.
Container structures may nest but must not interleave.
The various kinds of containers and their use are discussed in more detail in subsequent sections.

The atomic terms in __L__ are identifiers, symbols, operators, text, and numbers.

Identifiers are names that may be used to refer to language entities.
Identifiers must start with any Unicode alphabetic character or underscore
and may contain any Unicode alphabetic or numeric character,
hyphens, and underscores.

The following are all valid identifiers: `hello`, `thing-one`, `_42`, `радиус` and `عداد`.

Symbols are named entities that may be used as flags to represent a programmer-defined meaning.
They begin with a dollar sign and otherwise follow the syntax rule for identifiers.

For example, `$empty`, `$𓄿`, `$먼저`, and `$🐶🐮` are valid symbols.

Operators are special characters that may precede a value or couple two values.
__L__ defines a handful of infix and prefix operators for logical, comparison, and arithmetic functions. 

Text in __L__ is enclosed in either single or double quotes and consist of a sequence of Unicode code points.
Control characters and certain formatting characters must be escaped.

Quotes only need to be escaped if they are the same style as the delimiting quote marks.
The double quotes in the text `'The novelist said, "read my new book!"'` do not need to be escaped,
but in the text `"\"They said, 'it can't be done,'\" the programmer told me."`
the double quotes (but not the single quotes) must be escaped.

Finally, numeric literals to represent integers, decimals, and complex numbers.
Integers may be represented in both decimal (`1138`) and hex (`0xBADF00D`).
Floating-point fractions may be represented as decimals (`0.875`) or using scientific notation (`8.75e-1`).
Complex numbers are the sum of a real component and an imaginary component (`3 + 2i`).

## Basic Operators

## Matching

## Collection Types

## Text

## Functions

## Records and Unions
