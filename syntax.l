
# A little bit about the gozinta operator:
# Consider the identity function, which we'll call `id`:

id :: (x) -> { x }

# We can invoke it like so:

id(4)  # equals 4

# But what if we want to immediately invoke our function definition?
# The obvious way is to follow the definition with a call message.

four :: (x) -> { x } (4)

# But we can also use the expression `a ~> b` meaning "use a as the sole argument to b."
# Or you could say "a goes into (gozinta) b." And you can rewrite the declaration above as:

four :: 4 | (x) -> { x }

# Or:

four :: 4 |> id

# This also works with match blocks:

is_even :: 4 |> {{
	(n) & (n % 2 == 0) -> ( .True )
	(_) -> { .False }
}}



# Oh, and the fun implementation detail? The base type defines a `('=>':)` selector,
# which takes the 

# Currying

sum :: (a, b) -> { a + b }

sum($0, 3)       # equals (x) -> { sum(x, 3) }
4 |> sum($0, 3)  # equals (x) -> { sum(x, 3) } (4)

(a)->(b)->{ a + b }

(a) -> (b) -> { a + b } (4)          # equals (b) -> { 4 + b }
(a) -> { (3) |> (b) -> { a + b } }   # equals (a) -> { (b) -> { a + b } (3) }



Syntax << Node node, Set scopes >>

{ n } :: { .x }
symbol :: Syntax(node: n, scopes: Set[sc1])
symbol.node    # equals '.x'
symbol.scopes  # equals Set[sc1]

# A type method (sort of like a class method, but types aren't classes, so...)

Syntax (fromBlock: Block b) -> {
	{ node } :: b
	node(transform: (n)->{ Syntax(node: n, scopes: Set[]) })
}

list :: Sytax(fromBlock:) { [a, b, c] }
# [
#     Syntax(node: Identifier(label: 'a'), scopes: Set[])
#     Syntax(node: Identifier(label: 'b'), scopes: Set[])
#     Syntax(node: Identifier(label: 'c'), scopes: Set[])
# ]

Syntax syn (addScope: Scope s) -> {
	syn(adjustScope: s, using:(s1, s2) -> { s1 + s2 })
}

Syntax syn (flipScope: Scope s) -> {
	syn(adjustScope: s, using: (s1, s2) -> { s1(symmetricDifference: s2) })
}

# In __future__, it will be possible to refer to positional arguments like this:
# syn(adjustScope: s, using: { $0(symmetricDifference: $1) })
# syn(adjustScope: s, using: { $0 + $1 })

# Or even a selector? (Leaning towards no.)
# syn(adjustScope: s, using: (symmetricDifference:))
# syn(adjustScope: s, using: ('+':))

Syntax syn (adjustScope: Scope s, using: (Scope,Scope)->Scope func) -> {
	adjustScope :: (Node n) -> { (n(.type)) ~> {{
		(\Syntax) -> { Syntax(node: n.node, scopes: func(n.scopes, s)) }
		(\Node) -> { n(transform: adjustScope) }
	}} }
	
	adjustScope :: {{
		(Node n) -> (n(.type) == Syntax) ?? { Syntax(node: n.node, scopes: func(n.scopes, s)) }
		(Node n) -> { n(transform: adjustScope) }
	}}
	
	syn.node(transform: adjustScope)
}

#-

Additional methods to implement:
- add binding
- resolve

Define the Scope type

sc1 :: Scope()
sc2 :: Scope()

sc1 == sc2 # False
sc1 == sc1 # True

-#

# Nodes

# A protocol looks like a record followed by a list of selectors
# The selectors may have optional type annotations :)

Node <<>> [
	(transform: (Node)->$T) -> $T
]

# A protocol can define a default implementation, but only has access
# to the fields defined in its declaration

Node n (transform: func) -> {
	func(n)
}

# A type may declare which protocols it implements by including a
# comma-separated list of protocols after the type identifier.

Label << Text label >>

# Types that declare a record as part of their protocol automatically get
# the record's fields prepended to the new type's field list.

Symbol (Label, Node) << >>
Identifier (Label, Node) << >>

List (Node) << [Node] items >>

# Since items is type `[Node]` and func is type `(Node)->$T`,
# the type of `items(map:)` is `[$T]`. So the type signature for
# the whole method is `((Node)->$T)->[$T]`.

List l (transform: (Node)->$T func) -> [$T] {
	List(items: l.items(map: func))
}

Block (Node) << [Expression] expressions >>

Block b (tranform: (Node)->$T func) -> [$T] {
	Block(expressions: b.expressions(map: func))
}
