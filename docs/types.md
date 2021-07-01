
```
Answer << .Yes | .No >>

# We can define a function that pattern matches on an Answer
respond :: {{
	(.Yes) -> 'Okie-dokie!'
	(.No) -> 'Sorry, bud'
}}

# The 'respond' function above has a type signature of '(.Yes|.No)->Text'
# We could then create a new type 'Open':

Open << .Yes | .No >>

# And 'respond' would take a 
# If we want to 

response :: respond(.No)


Answer($T) << .Yes | .No | .Other($T) >>
Maybe($val) << .Some($val) | .Nothing >>
Result($err,$val) << .Ok($val) | .Error($err) >>

PlayerId << Integer >>   # Type alias?

Player << Integer id? :: _, Text name :: '' >>

Player (guest: Text name) -> { Player(_, name) }


<< Integer id, Text name >>


#- The unit type -#

# The Unit Type is the type with no values
Unit << >>

Unit()

```


	Comparable << >> [
		('==':) -> Boolean
		('!=':) -> Boolean
	]
	
	# Reflexivity: a == a
	# Symmetry: a == b ≡ b == a
	# Transitivity: a == b ⋀ b == c → a == c
	
	Sortable << >> [
		('<=':) -> Boolean
		('>=':) -> Boolean
		('>':) -> Boolean
		('<':) -> Boolean
	]
	
	# Totality: Either a <= b or b <= a
	# Antisymmetry: a <= b ⋀ b <= a → a == b
	# Transitivity: a <= b ⋀ b <= c → a <= c
	
	Semigroupoid($T) << >> [
		(compose: $T) -> $T
	]
	
	# Associativity: a(compose: b)(compose: c) ≡ a(compose: b(compose: c))
	
	Category ($T) : Semigroupoid <<>> [
		(.id) -> $T
	]
	
	Monoid ($T) : Semigroup << .Some($T) | .Empty >> [
		(concat: Monoid($T)) -> 
	]
	
	# Monoid.Empty(concat: m) ≡ m
	# m(concat: Monoid.Empty) ≡ m
	
	Group
	
	Filterable << >> [
		(filter: ($A)->Boolean) -> $A
	]
	
	# Distributivity: v(filter: (x) -> { p(x) /\ q(x) }) ≡ v(filter: p)(filter: q)
	# Identity: v(filter: (x) -> { Boolean.True }) ≡ v
	# Annihilation: v(filter: (x) -> { Boolean.False }) ≡ w(filter: (x) -> { Boolean.False })
	#     if v and w are both values in Filterable($A)
	
	Collection ($A) << >> [
		(map: ($A)->$B) -> $B
	]
	
	IntCollection (Integer) : Collection << [Integer] items >>
	IntCollection self (push: Integer item) -> { self.items(push: item) }
	IntCollection self (push)
	
	IntCollection self (append: Integer item) -> {
		
	}

	# Identity: u(map: (x) -> { x }) ≡ u
	# Composition: u(map: (x) -> { f(g(x)) }) ≡ u(map: g)(map: f)
	
	
```