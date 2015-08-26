# The 🅛 Programming Language

The L Programming Language is an experimental, minimalist, functional programming language.
It is designed around the radical philosophy that powerful programs should be concise
and easy to reason about.
Therefore, the syntax is minimal but extensible.
The language semantics can be extended through a safe macro system.

## Installing L

Clone the repository on your machine.
From within the project directory, run the following commands:

```
npm install
gulp build
```

The `gulp build` command will create a build directory in the project folder
with a browserified script and an interactive shell.

To run the interactive shell, invoke `node build/ell.js` from the command line.

## Using the Interactive Shell

L comes with an interactive shell.
After building the project, run `node build/ell.js` to start the shell.
You'll see an __L__ prompt like this:

```
The L Programming Language, v0.0.1
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

The documentation covers more things you can do with the shell.
