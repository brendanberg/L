# L Programming Language Concepts and Motivations

This document is a rambling collection of half-baked ideas, unexplored leads, inspirations, ---, and ---.


## Simplicity

Some features of a simple language and how to get them. I don't really agree with all this, but it's a neat start.

- Values vs. final, persistent collections
- Functions are just stateless methods
- Namespaces via language support (not via closures)
- Data via maps, arrays, sets, JSON, etc.
- Polymorphism via protocols, type classes
- Managed references like Haskell's or Clojure's
- Set functions (in library)
- Queues via language support (not via library)
- Declarative data manipulation (SQL, Datalog)
- Rules (DDM + backtracking and constraint programming)
- Consistency via transactions and values


## Look At These Things!

### Languages

- Lucid (Ed Ashcroft)
- Simula
- Imp (Ned Irons) *
- Joss

### People

- Niklaus Wirth
- Dave Reed

### Hardware

- Burroughs (Bob Barton)

### Concepts

- Transactions *
- Strachey Streams (what's that?)
- Lambda-calc, Pi-calc
- Syntax-directed compiler

- Late binding
- Reflectivity
- Homoiconicity, well-defined in its own environment (LISP is defined in LISP)
- Compile down to C
- Variables as streams

## John Siracusa's Programming Language "Good Things"

- Memory management
- Native unicode strings
- Native regular expressions
- Native objects (with classes)
- Named parameters
- "Succinct syntax for common operations" (avoid boilerplate)
- Concurrency ("At least acknowledge that it exists!")
