# Introduction to the 🅛 Programming Language

__L__ is a gradually typed multi-paradigm programming language with gradual typing, [feature], [feature], and intuitive concurrency.

## Syntax

```
>> greet :: (entity) -> { 'Hello, ' + entity + '!' }
>> greet('world')
'Hello, world!'
```

### Values

Values in __L__ are numbers, text, lists, maps, symbols, functions, and blocks.

__Number Literals__

Valid numbers in __L__ are base 10 and base 16 integers, arbitrary-precision decimals, scientific notation decimals, and complex numbers.

__Unions__

A union is a data type consisting of two or more variants belonging to a name. A value is one of the 

__Functions__

To create a function in __L__, use the arrow operator (`->`) to join a tuple of argument names to a block.

```
(x, y) -> { x - y }
```

The argument names are bound to local variables in the block when 

### Pattern Matching

```
fib :: {{
    (0) -> { 0 }
    (1) -> { 1 }
    (n) -> { fib(n - 1) + fib(n - 2) }
}}
```
