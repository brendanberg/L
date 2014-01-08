# The L Programming Language


## Values

The __L__ interactive console evaluates keyboard input as the programmer enters it. This document shows the dialogue between programmer and interpreter  to illustrate various concepts in __L__. The keyboard input is prefixed by the `>` (greater than) character, or for subsequent lines of a multi-line expression, the `-` (minus) character. Console responses have no prefix.

This guide switches between console transcripts and plain English explanations of the concepts. Comprehensive documentation of syntax, type system rules, and operational semantics can be found in the language specification.

	> _

The simplest expression is simply the empty type. It evaluates to itself, but the interpreter suppresses its display. The empty type, or [bottom](http://en.wikipedia.org/wiki/Bottom_type) is a type that has no values. It is commonly used to indicate a void return type.

	> True
	True

	> False
	False

The two boolean values in __L__ are `True` and `False`. They evaluate to themselves.

	> blub
	blub	

Atom types are identifiers in a context. Atoms are any string of characters that starts with an alphabet character or underscore followed by any number of alphanumeric characters, underscores, or hyphens. Attempting to evaluate an identifier that has not been assigned a value results in the empty type.

	> 42
	42

	> 0x2A
	42

	> 0.3
	0.3
	
	> 6.02e23
	6.02e+23

The main numeric type in __L__ is the rational type. It can represent integers and fractions with arbitrary precision. Integers can be represented in decimal or hexadecimal notation.

	> Math.pi
	≈ 3.141592653589793
	
	> Math.sin 0.5
	≈ 0.479425538604203

Numeric approximation types are double-precision [IEEE 754](http://en.wikipedia.org/wiki/IEEE_754-2008) floating-point values. Floating point numbers can include an optional exponent.

	> [2, 4, 6, 8]
	[2, 4, 6, 8]
	
	> [_, False, blub, 0x2A]
	[_, False, blub, 42]

Lists are a sequence type in __L__. They are represented as comma separated values enclosed in square brackets. Note that while the hexadecimal numeric literal is converted into the canonical base 10 equivalent, the identifier `blub` has not been evaluated. In __L__, identifiers are not evaluated until their value is explicitly requested.

	> = [3 .. 7]
	[3, 4, 5, 6]
	
	> = [1 .. 10 \ 2]
	[1, 3, 5, 7, 9]
	
	> = [5 .. 0]
	[5, 4, 3, 2, 1]

	> = [60 .. 1 \ 10]
	[60, 50, 40, 30, 20, 10]

Range literals are shorthand for numeric lists. They take a start value, a stop value and an optional stride. The resulting list is an arithmetic progression of integers from the start value up to, but not including the stop value. In the case that the lower bound is greater than the upper bound, the resulting list is in descending order. __L__ uses the backslash character to designate the stride of the list. An easy mnemonic for this syntax is "from x to y counting by z". For more complex list generation, see examples using the `map` and `filter` functions on sequence types.

	> "Hello, world!"
	'Hello, world!'
	
	> 'Gerrit Rietveld Straße'
	'Gerrit Rietveld Straße'
	
	> "In Korea, you'd say, \"안녕하세요 세상\""
	'In Korea, you\'d say, "안녕하세요 세상"'

Strings are sequences of unicode code points. Strings literals are characters enclosed in single or double quotes. Backslash (`\`) is used to escape characters that otherwise have special meaning inside a string, such as newline, tab, the quote character, or backslash itself.

	> {pianist : 'Bill', bassist : 'Scott', drummer : 'Paul'}
	{pianist: 'Bill', bassist: 'Scott', drummer: 'Paul'}

Dictionaries are ordered collections of key-value pairs. The Keys are objects that have defined an equality method and are hashable. Values are any object.

	> {
	-     pianist : 'Bill'
	-     bassist : 'Scott'
	-     drummer : 'Paul'
	- }
	{pianist: 'Bill', bassist: 'Scott', drummer: 'Paul'}

Dictionaries may span multiple lines. Commas are not necessary if each line contains only one key-value pair.


## Types and Evaluation

The __L__ programming language is strongly, but not explicitly, typed. The postfix `type` operator evaluates the type of a given expression.

	> = 16 type
	Integer
	
	> = 'a' type
	String
	
	> = 3.14 type
	Decimal

Pretty self-explanatory.

	> = [4, 5, 6] type
	List[Rat]
	
	> = ['B', 'D', 'F', 'M'] type
	List[String]
	
Maybe?

	> = ['a', 4] type
	List[T]
	
	> = { 'a' : 1, 'b' : 2, 'c' : 3 } type
	Map{String:Rat}

Container types are further identified by the keys' type and the values' type. Heterogeneous lists are specified with a type variable.

	> = rational type
	type
	
	> = type type
	type

Types also have a type. Their type is `type`.


## Operators on Scalar Types

	> number: 42
	> number
	42

A value can be assigned to an atom within a context using the assignment operator, a colon. An assignment expression evaluates to the empty type. Following an assignment, evaluating the atom in the same context results in the given value.

	> exp: 4 + 3
	> =exp
	7

An expression can be assigned to an identifier to be retrieved later. To evaluate its value, you must explicitly do so with the `=` operator either before or after assignment.

	> x, y: [ 4, 3 ]
	> x
	4
	> y
	3
	
	> a, b.., c: [ 1, 2, 3, 4, 5 ]
	> a
	1
	> b
	[2, 3, 4]
	> c
	5

The target (left-hand side) of the assignment operator can also be a list of identifiers. Assigning a list of the same number of elements assigns each element of the list to each identifier, in order.

	> m, n: {m: 7, q: -3}
	     ^  ^-----------^
	ValueError: identifier 'n' is not defined in map
	> m, n: {m: 7, n: 4, q: -3}
	> m
	7
	> n
	4
	> q
	  ^
	NameError: identifier 'q' is not defined

The same is possible with mapping types, but the target identifiers must be present in the map being unpacked. Superfluous identifiers in the map are ignored.

(Also: `+:`, `-:`, `*:`, `/:`, `|:`, `&:`, etc.)

	> = ! True
	False

	> = ~ 12
	-13
	
	> = - 4
	-4

The unary operator `!` (bang) performs a boolean negation. The values `_`, `0`, `False`, and `""`, the empty string are considered false; any other value is considered true. The unary operator `~` (tilde) performs a bitwise inversion on an integer value. The unary operator `-` (minus) negates an integer value.

	> = 3 + 4 * 9
	39

	> = 3 ** 2
	9

	> = 3 / 8
	0.375

	> = 5 // 2
	2

	> 5 % 2
	1

__L__ defines binary arithmetic operators for addition, subtraction, multiplication, integer and floating-point division, remainder (modulus), and exponentiation. Ordinary precedence rules apply. Numeric values have strict type promotion rules, so the arguments are converted to a common type before evaluation.

	> = 13 & 7
	5

	> = 10 | 4
	14

	> = 10 ^ 12
	6

The binary bitwise operators for *and*, *or*, and *exclusive or* operate on integers.


__Guard and Default Operators__

	> defaultAge: 18
	> ben: {
	-     height: 1.95
	- }
	- 
	> tim: {
	-     age: 23
	- }
	- 
	
The guard and default operators use short-circuit evaluation to return the result of a logical and or logical or. (The preceding values will be used in the illustrations to follow.)

	> = ben age or defaultAge
	18
	> = tim age or defaultAge
	23

The `or` operator (also known as default) evaluates the left-hand expression and if the result is `False`, `_`, `''` (the empty string), or `0`, immediately returns the value of the right-hand expression. Otherwise, it returns the value of the left-hand expression without evaluating the right-hand side. (This is a convenient way to specify a default value.)

	> = ben and ben height
	1.95
	> = jon and jon height
	
The `and` operator (also known as guard) evaluates the left-hand expression and if the result is `False`, `_`, `''`, or `0`, immediately returns its value without executing the right-hand side. Otherwise it returns the value of the right-hand expression. (This is a convenient way to check whether an identifier is defined before looking up a value on it.)


__The Condition Operator__

	> if number == 42 [
	-     "Life, universe, everything"
	- ] else [
	-     "Sorry"
	- ]
	Life, universe, everything

Conditional expressions evaluate a consequent if a condition is not a zero value, and may evaluate an optional alternate if the condition is any non-zero value. The consequent and alternate may be blocks which are evaluated as dictated by the truth value of the condition.

	> if False then "No"
	_

A conditional expression with no alternate will evaluate to bottom (`_`) if the condition is not true.

Interestingly, specifying blocks for the consequent and alternate avoids the dangling else problem. If a nested if expression is on one line, the precedence rules for identifier application force the `else` keyword to bind to the inner expression. That is, the `else` belongs to the `if` that immediately precedes it.


__ALSO:__

Logical operators: `and`, `or`, `=`, `is`, `is not`, `not`, `<`, `>`, `<=`, `>=`
Equality vs. equivalence: `=` : `is` :: `==` : `===`
Precedence rules: operators have overriding rules, but in general a shift-reduce eval stack is used.


## Operators on Sequence Types

	> numbers: ['zero', 'one', 'two', 'three', 'four', 'five']
	> = numbers 4
	'four'
	> = numbers [0, 3, 5, 2]
	['zero', 'three', 'five', 'two']
	> = numbers [2 : 4]
	['two', 'three']
	> = numbers [0 : 5 \ 2]
	['zero', 'two', 'four']
	> = numbers [1 : 5 \ 2]
	['one', 'three']

A subscript of a sequence is a selection of an item or list of items from a sequence. If the subscript is a list with a single item, the result is the value in the mapping that corresponds to that key. If the subscription is a list with multiple values, the result is a list made up of the values in the mapping that corresponds to each key, in order.

	> words: "a man a plan a cam a yak a yam a canal panama"
	> = words [2 .. 5]
	'man'
	> = words [44 .. 34]
	'amanap lan'
	> = words [13 .. 32 \ 6]
	'aaaa'

Because strings are sequences of unicode code points, string subscription works the same way.

	> = [0, 1, 2, 3] + [4, 5, 6]
	[0, 1, 2, 3, 4, 5, 6]
	
	> = "Bread" + " and " + "butter"
	'Bread and butter'

Sequence concatenation uses the `+` operator.

	> list: [a, b, c]
	> list 1: x
	> list
	[a, x, c]

Assigning to a list subscription replaces a value.


## Operators on Collection Types

	> trio: { pianist: 'Bill', bassist: 'Scott', drummer: 'Paul' }
	> = trio pianist
	'Bill'
	> trio drummer: 'George'
	> trio
	{ pianist: 'Bill', bassist: 'Scott', drummer: 'George' }

Dictionary lookup behaves similarly.

	> translate: {'one': 'ein'}
	> = translate 'one'
	'ein'
	> translate 'one': 'uno'
	> translate 'two': 'dos'
	> translate 'three': 'tres'
	> = translate 'two'
	'dos'

Assignment to a dictionary key sets a value (replacing any existing value).


## Blocks and Contexts

A block is deferred computation. Blocks consist of indented expression lists. 

	> later: 8 + number
	> later
	8 + number
	> = later
	50

A block is deferred computation. It is a newline character followed by an indented, newline separated list of expressions. The block itself is an expression that results in a value when evaluated. (Here, a block with the expression `= 8 + number` is being assigned to the identifier `later`. Recall that we previously assigned the value 42 to `number` in an example above.) Evaluating the identifier results in the body of the block.

	> = 2 * later
	100
	> explain 2 * later
	      2 * (8 + number)

When evaluating an expression containing a block, the block will be evaluated before evaluating the enclosing expression.


## Functions are Blocks

	> double : x => [
	-     x * 2
	- ]
	> double
	x => [
	    x * 2
	]
	
A function is a block that takes input and returns a value. Functions can be assigned to an identifier, and the body of the function can be recalled.

	> = double type
	fn(number => number)
	> = double 4
	8

Explain arguments. Evaluating the function (passing arguments ...) results in the application of argument in the function body

	> average: m => [
	-     total: m folda [x, s] => [
	-         x + s
	-     ]
	-     total / ( m length )
	- ]
	- 
	> = average [21, 26, 22]
	23.0

More about functions

	> = average type
	fn(list[number] => float)

Function types are identified by the argument types and the return type

	> fact: n => {
	-     1: 1
	-     _: = n * fact (n - 1)
	- }
	- 
	> fact
	n => {
	    1: 1
			_: -> = n * fact (n - 1)
	}
	> = fact 4
	24

Functions may also accept named arguments, which are atoms captured by the function block. Calling a function with an argument simply uses an expression in place of the captured identifier.

	> acc: i -> [
	-     n -> [
	-         i +: = n
	-         = i
	-     ]
	- ]
	- 
	> f: = acc 4
	> f
	n -> [
	    i +: = n
	    = i
	]
	> = f 1
	5
	> = f 3
	8

Closures.

	> plus: [a, b] -> [
	-     = a + b
	- ]
	- 
	> xplus1 : x -> plus [x, 1]
	> = xplus1 5
	6

Currying.


## Functions Defined on Sequence Types

All values in __L__ are objects (or more precisely, have methods defined for their type). Derp.

	> = [1 .. 10] filter x -> = x % 2 == 0
	[2, 4, 6, 8, 10]

The `filter` function takes a function argument and applies it to each element of the list in turn, appending the element to the new list based on the truthiness of the test function.

	> = [1 : 5] map x -> x * x
	[1 * 1, 2 * 2, 3 * 3, 4 * 4, 5 * 5]
	
	> = [1 : 5] map x -> = x * x
	[1, 4, 9, 16, 25]

The `map` function applies a given function to each element of the list, and the new list is made up of the result of evaluating the function for each element. Note that removing the eval operator (`=`) from the function results in a list of expressions instead of values.

	- list :
	-     # ...
	-     map : fn ->
	-         val[0] := fn val[0]
	-         val[1:] map fn

Conceptually, this is what `map` looks like. It applies `fn` to the head of the list and recursively calls itself on the tail. (Note that the actual implementation may differ for performance reasons.)


## Objects are Blocks

	> Point :
	-     __super__ : object
	-     init : [x, y] ->
	-         self := __super__ init
	-         self x := x
	-         self y := y
	-         = self
	-     __plus__ : other ->
	-         sum := point init [= self x + other x, = self y + other y]
	-         = sum
	-     __incr__ : other ->
	-         self x +:= other x
	-         self y +:= other y

Since blocks create a context, objects are simply blocks with identifiers in their own context. Spring's object model is prototype based, but offers no special syntax to manipulate objects, so the base class `object` is defined that provides basic object functionality. The `init` function copies the object definition and returns the copy. Inheritance is achieved by assigning an object to a `super` identifier and overriding the `init` function if desired. Additional `init` functions that take arguments may be defined, and should assign the result of `super init _` to `self`, do whatever set-up is required, and return `self`.

	> p1 := Point init [3, 4]
	> p2 := Point init {x: 5, y: 2}

Pretty clear, really.

	> = p1 x
	3
	> p1 init
	[x, y] ->
	      self := __super__ init
	      self x := x
	      self y := y
	      = self

Property lookup on an object.


## Control Flow

The __L__ programming language lacks a traditional `for` statement, since `map`, `fold`, and `filter` can perform the same computation. Explicit looping is also discouraged because it makes concurrency difficult. For example, folding a list with a function that is mathematically associative can be implicitly paralellized.

	> sum : 0
	> = [ 2, 4, 6 ] map x ->
	-     sum +: x
	- 
	> = sum
	6
	
	> = [ 1, 3, 5, 7] folda [i, j] ->
	-     = i + j
	16

Two ways to compute the sum of a list.


## Languages That Influenced __L__

- [Self](http://en.wikipedia.org/wiki/Self_%28programming_language%29), a prototypical OO language similar to Smalltalk
- [Smalltalk](http://en.wikipedia.org/wiki/Smalltalk), a dynamically typed, reflective OO language developed at Xerox PARC.
- [Python](http://python.org/), a dynamic scripting language that pairs powerful features and clear syntax
- [CoffeeScript](http://jashkenas.github.com/coffee-script/), a candy coating for JavaScript

  
