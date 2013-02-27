# __L__ Match Literal Syntax and Semantics

Draft of syntax and matching rules for __L__ match objects. Match objects may be dictionary keys which accept one or more objects during dictionary lookup.

1. Match a literal value

    Any literal value may be a dictionary key, which matches equivalent values.

    `5` matches the message `5`  
    `"Foo"` matches the message `"Foo"`  
    `[0, 1, 2]` matches the message `[0, 1, 2]`  
    `_` matches the message `_` (bottom, or empty type).  

2. Match a particular type or interface

    `/Number/` matches any message of type `Number`.  
    `/String/` matches any message of type `String`.  
    `/List/` matches any message of type `List`.

3. Restrict the matched type with attributes or properties. There are a couple of ways to do this:

    With anonymous functions as match restrictions. (To match, the function must return `True` for the message.)

    `/Number (x) => x > 0/` matches any number greater than zero.  
    `/String (x) => x == ""/` matches the empty string.  
    (Note that `/Number/` is really a shorthand for `/Number => True/`.)  

    With an implicit lambda, passing an expression of type bool to the type.

    `/Number > 0/`  
    `/String = ""/`  

4. Capture variables into the locals dictionary with named IDs

    `/Number x/`  
    `/Number x > 0/`  
    `/Number x => x % 2 = 0/` matches any even number and captures the value as `x`.

5. Specify nested data structures

    `/{distanceTo: Point p}/`  
    `/{distanceTo: Point (p) => p x > 0 and p y > 0}/`  

    `/{latitude:, longitude:}/` Matches an object with `latitude` and `longitude` properties.  
    `/{:latitude, :longitude}/` Alternate.
		`/{latitude:lat, longitude:}/` Matches objects as above, but captures the `latitude` value as `lat`.  
    `/{topLeft:{x:, y:}, bottomRight:{x:, y:}}/` Match an object with `topLeft` and `bottomRight` properties, each of which have `x` and `y` properties.
    
    `/[a, b]/` matches any list with two items and assigns the first to `a` and the second to `b`  
    `/[hd, tl...]/` Matches a list and assigns the first element to `hd` and the remaining items of the list to `tl`  
    `/{scaleByX: x, andY: y}/` Matches a dictionary with the keys `scaleByX` and `andY` and assigns those values to the variables `x` and `y`.  
    `//`
