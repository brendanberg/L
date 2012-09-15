# __L__ Match Literal Syntax and Semantics

Draft of syntax and matching rules for __L__ match objects. Match objects may be dictionary keys which accept one or more objects during dictionary lookup.

(0) Match a literal value

`/5/` matches the message `5`  
`/"Foo"/` matches the message `"Foo"`  
`/_/` matches the message `_` (bottom, or empty type).  

(1) Match a particular type or interface

`/Number/` matches any message of type `Number`.  
`/String/` matches any message of type `String`.  

(2) Restrict the matched type with attributes or properties. There are a couple of ways to do this:

With anonymous functions as match restrictions. (To match, the function must return `True` for the message.)

`/Number (x) => x > 0/` matches any number greater than zero.  
`/String (x) => x == ""/` matches the empty string.  
(Note that `/Number/` is really a shorthand for `/Number => True/`.)  

With an implicit lambda, passing an expression of type bool to the type.

`/Number > 0/`  
`/String == ""/`  

(3) Capture variables into the locals dictionary with named IDs

`/Number x/`  
`/Number x > 0/`  

(4) Specify nested data structures

`/Dict{distanceTo: Point p}/`  
`/{distanceTo: p of Point}/`  
`/{distanceTo: Point (p) => p x > 0 and p y > 0}/`  

`/[hd, tl...]/` Matches a list and assigns the first element to `hd` and the remaining items of the list to `tl`  
`/{scaleByX: x, andY: y}/` Matches a dictionary with the keys `scaleByX` and `andY` and assigns those values to the variables `x` and `y`.  
`//`

----

`/[0, 1, 2]/` Matches literal  
`/[foo]/`  
