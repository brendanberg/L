# Introduction to the 🅛 Programming Language

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
They begin with a period and otherwise follow the syntax rule for identifiers.

For example, `.empty`, `.𓄿`, `.먼저`, and `.🐶🐮` are valid symbols.

### Numbers

Numeric literals can represent integers, decimals, and complex numbers.
Integers are positive and negative whole numbers,
and may be represented in both decimal (`1138`) and hexadecimal (`0xb7d7e8` or `0x92A8D1`).
Fractional values may be written as floating-point decimals (`0.875`) or using scientific notation (`8.75e-1`).

Additional numeric types may be constructed by combining atomic values.
A rational number is the result of an expression combining two integers with the `/` operator.
Rational numbers are stored in simplified form, so `7 / 42` becomes the fraction ⅙.
Complex numbers are the sum of a real component and an imaginary component,
where the imaginary part is followed by `i`, `j`, or `J`.
The expression `3 + 2i` evaluates to the complex number 3 + 2*i*.

### Text

Text in __L__ is enclosed in either single or double quotes and consist of a sequence of Unicode code points.
Control characters and certain formatting characters must be escaped.

Quotes only need to be escaped if they are the same style as the delimiting quote marks.
The double quotes in the text `'The novelist said, "read my new book!"'` do not need to be escaped,
but in the text `"\"It works!\" exclaimed the scientist, \"yet they told me, 'it can't be done.'\""`
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
- Logical 'and' (`p /\ q`)
- Logical 'or' (`p \/ q`)

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
minusFive :: -5              # minusFive is -5
alsoMinusFive :: +minusFive  # alsoMinusFive is -5 because +(-5) is still -5
```

The binary arithmetic operators behave similarly to a standard pocket calculator.

```
2 + 3                     # equals 5
8 - 3                     # equals 5
6 * 7                     # equals 42
6 / 8                     # equals the fraction ¾
```

## The Bind Operator

Instead of the more familiar assignment operator,
__L__ uses structural pattern matching to bind values onto corresponding variables.
Pattern matching is written as an expression using the `::` operator,
where values on the right hand side are bound to identifiers specified in the pattern on the left hand side.

### Basic Pattern Matching

A single identifier on the left-hand side of a match will bind to any value on the right.

```
a :: 5                        # 'a' gets the value 5
list :: [1, 2, 3]             # 'list' gets the value [1, 2, 3]
sum :: a + 7                  # 'sum' gets the value 12 because 'a' is evaluated 
                              #    to the previously assigned value of 5
```

### Destructuring

A list on the left-hand side will only match with a list value on the right.
If each item in the list is an identifier, both sides must have the same length.

```
[p, q, r] :: [3, 4, 5]        # 'p' gets the value 3, 'q' gets 4, and 'r' is 5
[x, y] :: [2, 3, 4]           # Error, because both sides are not the same length
```

Patterns may contain literal values,
which must equal the value in the corresponding position on the right-hand side.

```
[0, uno, dos] :: [0, 1, 2]    # 'uno' is 1 and 'dos' is 2
[1, fizz, buzz] :: [0, 0, 0]  # Error, because 1 does not equal 0
```

To match a variable number of items,
use the `...` operator after an indentifier to collect the remaining values into a list.
The pattern may contain identifiers or literals on either side of the `...`,
but may only contain one collection identifier.

```
[empty...] :: []              # 'empty' is []
[full...] :: [16, 25, 36]     # 'full' is [16, 25, 36]
[c, d...] :: [9, 8, 7]        # 'c' is 9 and 'd' is [8, 7]
[0, f..., g] :: [0, 1, 1, 2]  # 'f' is [1, 1] and 'g' is 2
```

Additional destructuring features are supported on other data types discussed later in this intruduction.

## The Text Type

As mentioned earlier, text literals may be specified in __L__ programs by enclosing a sequence of Unicode code points in single or double quotes.

### Text Operators

A number of operators are supported on text values in __L__. They are:

- Concatenation (`a + b`)
- Element-wise code point access (`a @ b`)
- Equality (`a == b`)
- Inequality (`a != b`)
- Equal to (`a == b`)
- Not equal to (`a != b`)
- Precedes (`a < b`)
- Follows (`a > b`)
- Precedes or equal to (`a <= b`),
- Follows or equal to (`a >= b`).

The `+` operator concatenates the contents of two text values and returns a text value with the joined contents. The `@` operator

```
'Hello, ' + 'world!'      # equals 'Hello, world!'
'abcdefg' @ 3             # equals 'd'
```

The __L__ comparison operators discussed previously are also defined for text values. Each operator returns a boolean value to indicate whether the relationship is true or false.

```
'apple' == 'apple'        # true, because the string contents are identical
'banana' != 'BANANA'      # true, becaues the string contents are not identical
'apple' < 'banana'        # true, because 'apple' is found before 'banana' alphabetically
'aardvark' > 'apple'      # false, because 'aardvark' is found before 'apple' alphabetically
```

### Text Methods

The number of Unicode code points in a sequence of text may be queried using the `(count.)` method.

```
'Hamburger'(count.)       # equals 9
'🍔'(count.)              # equals 1 because the hamburger emoji is U+1F354

'Café'(count.)            # equals 4 because the final é is U+00E9, latin small e with acute accent
'Café'(count.)            # equals 5 because despite appearing identical to the example above, the
                          #    final glyph consists of the surrogate pair U+0065 (latin small e),
                          #    and U+0301 (combining diacritic acute accent)
```

The `(split:)` method separates a length of text into a list of subsequences, using a specified separator that delineates subsequences. 

```
'the quick brown fox'(split: ' ')    # equals ['the', 'quick', 'brown', 'fox']
'a man, a plan, a canal, panama'(split: ', ')    # equals ['a man', 'a plan', 'a canal', 'panama']
```

Additional text methods are described in the [Text Type Documentation][text].

[text]: docs/types/text.md


## Collection Types

__L__ provides two primary data types for storing collections of values.
Lists are ordered sequences of values that may be accessed by their numeric index.
Maps are collections of key-value associations.
Both lists and maps provide syntax for accessing values and modifying contents.

### Lists

The most common way to create a list in __L__ is to use a list literal,
which is written as a list of comma-separated values enclosed in square brackets:

```
[ 'a', 'b', 'c' ]
```

The length of a list can be queried using the `(count.)` selector.

<pre>
>> <b>ls :: ['a', 'b', 'c']</b>
>> <b>ls(count.)</b>
3
</pre>

To retrieve an item from a list, use the `@` operator,
where the left-hand side is the index of the value you want to retrieve.
Indexes are integer values starting at 0 up to one less than the length of the list.
A negative index will retrieve counting backwards from the end of the list.

<pre>
>> <b>ls @ 1</b>
'b'
>> <b>ls @ -2</b>
'a'
</pre>

### Maps

Maps are collections of relationships from keys to values.
A map literal is written as a list of key-value pairs, with a colon separating the key from the value.

```
numbers :: [ 'one': 'uno', 'two': 'dos', 'three': 'tres', 'four': 'quatro']
```

The `numbers` map is initialized with four key-value pairs, the first ...

An empty map literal is written as `[:]` in order to distinguish from an empty list.

The `@` operator is used to query the map for the value associated with a specified key.
If the map does not contain a value for the given key, the query returns `_`. 

<pre>
>> <b>numbers @ 'one'</b>
'uno'
>> <b>numbers @ 'five'</b>
_
</pre>

## Records and Unions

In addition to lists and maps,
__L__ supports two additional types that allow programmers to define their own data structures.

### Records

A record is a data type consisting of a group of named fields.
Record declarations are written as a type identifier
followed by a comma separated list of field declarations enclosed in double angle brackets.

Here, a record type called `Point` is created with two integer fields, `x` and `y`.

```
Point << Integer x, Integer y >>
```

Once defined, a record type may be referenced through its type identifier.
Creating an instance of a record can be done by providing values for each of its fields.

```
Point(x: 4, y: 7)      # returns a value of type `Point` where x == 4 and y == 7
```

Field values are accessed using attribute lookup notation.
If a new point were assigned to the variable `p`,
the expression `p.x` would return the value associated with that field in the record.

### Unions

A union is a data type consisting of two or more variants associated with a type identifier.
Union declarations are written as a type identifier
followed by a pipe-separated list of symbols enclosed in double angle brackets.

Unions are useful when representing values that can be one of a finite number of options.
For example, when simulating a coin toss, we could use a union called `Coin` with symbols for heads and tails.

```
Coin << .Heads | .Tails >>
```

A value of type `Coin` must be exactly one of either heads or tails.
Creating a value of a union is written using attribute lookup notation,
In this example, `Coin.Heads` and `Coin.Tails` are the only two values of type `Coin`.

Additionally, any symbols in a union may declare associated data,
written as a list of type identifiers in parentheses.
In the example below, each of the `Shape` union's three symbols declares associated values.
The `.Circle` symbol is associated with a decimal value to represent its radius,
the `.Square` symbol has an associated decimal value to represent its width,
and the `.Rectangle` symbol has two associated values: one to represent width and the other to represent height.

```
Shape << .Circle(Decimal) | .Square(Decimal) | .Rectangle(Decimal, Decimal) >>
```

Symbols with associated values behave as functions,
so a union value with associated data is created by calling the symbol with a parenthesized list of values.

```
paper :: Shape.Rectangle(21.0, 29.7)
```

Accessing associated values can be done with pattern matching.

```
.Rectangle(x, y) :: paper      # after matching, x is 21.0 and y is 29.7
```

## Functions

A function is a sequence of operations grouped with a description of its input.
When a function is invoked by providing it with input values, it executes the operations and produces a value as output.

Functions in __L__ consist of a list of input parameters in parentheses, followed by the `->` arrow operator,
and finally a list of expressions in braces that are evaluated when the function is invoked.
All functions in __L__ are anonymous, and must be bound to a variable if we want to refer to it later in our program.

Here is the definition of a function that calculates the average of two numbers, __*x*__ and __*y*__.
We assign the function to the variable `average` so we have a way to reference it in the future.

```
average :: (x, y) -> { (x + y) / 2 }
```

We can invoke the function passing it a list of values.
So to calculate the average of, say 42 and 34, we would write `average(42, 34)`.
Invoking the function creates a new context and binds the parameters to the variable names in the function's definition.
When `average(42, 34)` is invoked, __*x*__ is assigned the value 42, and __*y*__ is assigned the value 34.
The body of the function has access to the values passed to it by referencing the input parameter names.

### Pattern Matching in Functions

A function in __L__ can express more than just the names of its input parameters.
The input parameters have the same behavior as the bind operator discussed earlier in the introduction.
This feature gives us more expressive power when defining functions.

Consider a use case where we want to restrict a function to only accept a two-element list as its argument.
We could write the function in a way that expresses that constraint
and when the function is called with a value that is not a two-element list,
the match will fail and the function will return `_`.

```
([x, y]) -> { #- do something with x and y -# )
```

### Hybrid Functions

Pattern matching arguments can be useful on its own,
but its real power is apparent when building hybrid functions.
A hybrid function is a collection of function definitions that can define different behavior for different conditions of input.

A classic example is defining base cases for recursive functions.
The factorial function is defined for some positive integer __*n*__
as __*n*__ times all the integers less than __*n*__ down to 1.

More precisely, we could write:

```
factorial :: {{
    (1) -> { 1 },
    (n) -> { n * factorial(n - 1) }
}}
```

When `factorial` is called with the value 1,
the first component in the definition matches the value and returns 1.
If the function is called with a value larger than 1,
the second component matches and returns __*n*__ times the value of `factorial` called with one less than __*n*__.
This repetion will continue until the value is decremented all the way to 1
and the call to `factorial` executes the base case.

### Guard Expressions

There's a subtle bug in the implementation of the `factorial` function in the previous section.
If the function is called with a value *less* than 1,
the base case will never be called since the value of __*n*__ will continue to decrement towards negative infinity.

We can solve this problem with a guard expression that prevents the recursive case from being matched with nonsense values. 
A guard expression follows the input parameter list and is announced with a `?`:

```
factorial :: {{
    (1) -> { 1 }
    (n) ? (n > 0) -> { n * factorial(n - 1) }
}}
```

Now when we call `factorial(-98)`, none of the function's components match, and we get the value `_` indicating an error.
