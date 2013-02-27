Advanced Features of the L Programming Language
===============================================

The following is a braindump of advanced features for the __L__ Programming Language.
They're not specifically new or ground-breaking, but they are usually seen in so-called "powerful" languages.

Evaluate Operator
-----------------

The evaluate operator (`=`) is used to immediately evaluate a value that would otherwise have been evaluated lazily.

This can be useful in cases where an anonymous function wants to use the current value of a variable
at the the function is defined, rather than the value at call time. For example:

	> a : "Hello, "
	> b : "world!"
	> one : =>
	-     [a, b] joinWith:" "
	-
	> one
	"Hello, world!"
	> b : "everybody!"
	> one
	"Hello, everybody!"
	> two : =>
	-     [a, =b] joinWith:" "
	-
	> b : "nobody."
	> two
	"Hello, everybody!"


Quote
-----

A single expression may be quoted by surrounding it with pipe characters.
The syntax within the pipes is parsed into an abstract syntax tree as regular source would be, but is not evaluated immediately.
The evaluate operator can be used to unquote specific values that should be evaluated immediately.

	> a : "Hello,"
	> b : "world!"
	> one : | [a, b] joinWith:" " |
	> one
	AbstractSyntax object at 0x4002a3
	> = one
	"Hello, world!"
	> b : "everybody!"
	> = one
	"Hello, everybody!"
	> two : | [a, =b] joinWith:" " |
	> b : "nobody."
	> = two
	"Hello, everybody!"

The result of a quoted expression is an abstract syntax object,
which can be evaluated in the current context or evaluated with a given context.

	> ctx : {
	-     a : "Bonjour,"
	-     b : "monde!"
	- }
	> one evaluateInContext:ctx
	"Bonjour, monde!"

This feature is extremely helpful when writing macros or language runtimes.


Macros
------

Macros are safe ways to manipulate code at compile time. (What specifically makes a macro hygenic?)
They are specified in the parser object as a collection of mappings from pattern to function.

	> runtime grammar union: {
	-     expr op='+' expr: e1, op, e2 =>
	-         if e1 respondsTo:__add__
	-             | e1 __add__: e2 |, _
	-         else
	-             if e2 respondsTo:__dda__
	-                 | e2 __dda__ e1 |, _
	-             else
	-                 _, NotImplemented

Problem areas: (one) if the parser matches strings of tokens and replaces them with abstract syntax,
how do I know at compile time which expressions 'respondsTo' a message;
(two) perhaps strong typing and a good type inferencer would allow me to ask,
at the abstract syntax level, what an expression responds to.

