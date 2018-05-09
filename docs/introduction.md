# Introduction to the L Programming Language

Hello.

## Syntax

A program in __L__ is a list of expressions.
Expressions may be atomic terms like the literal number `1` or text `'hello'`,
compound expressions made up of multiple individual terms like the product `6 * 7`,
or containers of other expressions like the list `[1, 2, 3]` or block `{ x + y }`.

__L__ has five container structures that are enclosed by matched open and close symbols.
The individual items in a container are separated by a comma or newline character.
For example, the list `['one', 'two', 'three']` can also be represented on multiple lines:

```
[
    'one'
    'two'
    'three'
]
```

Commas are optional at the end of a newline, and trailing commas are permitted.
A container must be fully enclosed within its parent, meaning `[1, 2, { 3 + 4 ], 7 }` is not valid in __L__.

### Identifiers

Identifiers are names that may be used to refer to language entities.
Identifiers must start with any Unicode alphabetic character or underscore
and may contain any Unicode alphabetic or numeric character,
hyphens, and underscores.

The following are all valid identifiers: `hello`, `thing-one`, `_42`, `радиус` and `عداد`.

### Symbols

Symbols are named entities that may be used as flags to represent a programmer-defined meaning.
They begin with a dollar sign and otherwise follow the syntax rule for identifiers.

For example, `$empty`, `$𓄿`, `$먼저`, and `$🐶🐮` are valid symbols.

### Numbers

Numeric literals can represent integers, decimals, and complex numbers.
Integers are positive and negative whole numbers,
and may be represented in both decimal (`1138`) and hexadecimal (`0xBADF00D`).
Fractional values may be written as floating-point decimals (`0.875`) or using scientific notation (`8.75e-1`).

Additional numeric types may be constructed by combining atomic values.
A rational number is the result of an expression combining two integers with the `/` operator.
Rational numbers are stored in simplified form, so `7 / 42` becomes the fraction ¹⁄₆.
Complex numbers are the sum of a real component and an imaginary component,
where the imaginary part is followed by `i`, `j`, or `J`.
The expression `3 + 2i` evaluates to the complex number 3 + 2i.

### Text

Text in __L__ is enclosed in either single or double quotes and consist of a sequence of Unicode code points.
Control characters and certain formatting characters must be escaped.

Quotes only need to be escaped if they are the same style as the delimiting quote marks.
The double quotes in the text `'The novelist said, "read my new book!"'` do not need to be escaped,
but in the text `"\"They told me, 'it can't be done,'\" exclaimed the visionary."`
the double quotes (but not the single quotes) must be escaped.

## Basic Types and Operators

Operators are special symbols that define an operation on one or more values.
The two kinds of operators in __L__ are prefix operators, where a symbol precedes a value as in `-7`,
and infix operators, which join two values as in `6 * 7`.

__L__ defines infix and prefix operators for concise representations
of common logical, comparison, and arithmetic operations. 

### Comparison Operators

The comparison operators provide information about the equality or inequality relationship between two values.

The comparison operators in __L__ are:
- Equal to (`a == b`)
- Not equal to (`a != b`)
- Less than (`a < b`)
- Greater than (`a > b`)
- Less than or equal to (`a <= b`),
- Greater than or equal to (`a >= b`).

Each operator returns a boolean value to indicate whether the relationship is true or false.

```
1 == 1             # true because 1 equals 1
3 != 4             # false because 3 does not equal 4
3 < 4              # true because 3 is less than 4
5 > 2              # true because 5 is greater than 2
2 <= 2             # true because 2 is less than or equal to 2
5 >= 7             # false because 5 is not greater than or equal to 7
```

### Logical Operators

The logical operators create logical statements that are true or false depending on the logic status of their values.

__L__ supports the following logical operators:
- Logical 'not' (`!p`)
- Logical 'and' (`/\`)
- Logical 'or' (`\/`)

The logical not prefix operator returns a boolean negation of a logical value.

```
p :: 1 == 0        # p is false
!p                 # true because 'not false' is true
```

The logical 'and' and 'or' operators create expressions that represent the logical relationship between its values.
These expressions use "short-circuit" evaluation so that the right side of the expression is only evaluated
if the left side does not provide enough information to evaluate the entire expression.
For example, in a logical 'and', the entire expression is false if the lefthand expression is false,
so the righthand expression does not need to be evaluated.

```
p :: Boolean.True
q :: Boolean.False

p /\ q             # false because p and q are not both true
p \/ q             # true because p is true
```

### Aritmetic Operators

The arithmetic operators in __L__ are supported on all built-in numeric types. They are:
- Negation (`-a`)
- Addition (`a + b`)
- Subtraction (`a - b`)
- Multiplication (`a * b`)
- Division (`a / b`)

The negation operator (also known as *unary minus*) toggles the sign of an integer,
so a negative value will become positive and a positive value will become negative.

```
five :: 5
minusFive :: -five        # minusFive is -5
plusFive :: -minusFive    # plusFive is -(-5), or 5
```

There is a unary plus operator that returns the unmodified value, 

```
minusFive :: -5           # minusFive is -5
alsoMinusFive +minusFive  # alsoMinusFive is -5 because +(-5) is still -5
```

The binary arithmetic operators behave similarly to a standard pocket calculator.

```
2 + 3                     # equals 5
8 - 3                     # equals 5
6 * 7                     # equals 42
6 / 8                     # equals the fraction ³⁄₄
```

## The Text Type

## Collection Types

### Lists

### Maps

## Records and Unions

## Functions

## The Match Operator

## Pattern Matching in Functions
