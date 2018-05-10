# The 🅛 Programming Language

The __L__ Programming Language is an experimental, minimalist, multi-paradigm programming language.
It is designed around the radical philosophy that programs should be intelligible
and easy to reason about.
Therefore, the core syntax is concise but extensible
and the language semantics can be extended through a safe macro system.

## Design Goals

The __L__ Programming Language is designed to be intuitive
and easily comprehensible after learning the foundational building blocks of the syntax.
The syntax is distinctive in its lack of reserved words
and its structural simplicity.

The language's built-in concurrency semantics combined with a powerful runtime
make it easy to write distributed concurrent programs.

## Notable Features

- __Pattern Matching:__
  One of the first surprising features of __L__ is that it does not have an assignment operator.
  Instead, it uses a "match" operator to structurally map values onto their corresponding variables.
  
  <pre class="highlight highlight-source-shell">
  [x, y..., z] :: [16, 25, 36, 49, 64]    <span class="pl-c"># x == 16, y == [25, 36, 49], and z == 64</span>
  </pre>

- __Gradual Typing:__
  Variables are not required to explicitly state the data type of the value they contain.
  The runtime is able to infer most of the necessary type information to run a program,
  but when a programmer wishes to add additional constraints to an implementation,
  they can add explicit types for compile-time checking.

- __First-Class, Anonymous Functions:__
  All functions in __L__ are first-class values.
  A function may receive another function as an argument and return a function as a result.
  Functions in __L__ are not named,
  but they may be assigned to variables just like any other value.

- __Algebraic Data Types:__
  There are two main user-definable data types in __L__.
  Unions are collections of two or more named variants.
  The `Boolean` data type is an example of a union having variants for `True` and `False`. 
  Records are values that are collections of named fields.
  Cartesian points, for example, could be represented as a record,
  having values for their `x` and `y` components.

There are far more features than can be highlighted here,
so the best place to learn more is the [Introduction to the L Programming Language][intro].

## Installing L

Clone the repository and from within the newly created project directory,
run the following commands:

```
npm install
npm run metal
```

The `npm run metal` command starts the interactive shell.

You can learn more about the internal workings of the language and interactive shell in the [Contribution Guidelines][contrib].

[contrib]: docs/contributing.md

## Using the Interactive Shell

__L__ comes with an interactive shell.
After building the project, run `npm run metal` to start the shell.
You'll see an __L__ prompt like this:

```
The L Programming Language, Meta-L v0.2.02
>>
```

You can type any __L__ program at the `>>` prompt and
it will be evaluated and the result will be printed on the next line.

In the documentation, we include transcripts of a programmer interacting with the shell.
Shell transcripts are formatted in monospaced text,
and anything the programmer would type is in bold.

Here's a simple example of an __L__ program:

<pre>
>> <b>1 + 1</b>
2
</pre>

The [Intruduction to the L Programming Language][intro] is a good place to learn about what the shell can do.

[intro]: docs/introduction.md
