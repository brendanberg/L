
```
>> list :: ['a', 'man', 'a', 'plan', 'a', 'cat', 'a', 'canal', 'panama']
Ok.
>> list => (word) & (word(.count) > 1) -> { word(.capitalize) }
['Man', 'Plan', 'Cat', 'Canal', 'Panama']
```

```
>> list |> (word) ? (word(count.) > 1) -> { word(capitalize.) }
```

```
# This would mean that the gozinta operator somehow "does the right thing"
# depending on whether the left-hand side is scalar or sequence...

# This actually could work, since gozinta is defined on on each type.
# Gozinta would have to return the same shape as its left-hand side
# On scalars:    $T ('=>': ($T)->$U) -> $U
# On sequences:  [$T] ('=>': ($T)->$U) -> [$U]
# On mappings:   [$T : $V] ('=>': ($T : $V)->$U) -> [$U]

# But --

>> scalar :: 'I'
>> scalar |> (word) ? (word(.count) > 1) -> { word(.capitalize) }
_

# Is this expected? Weird? I mean $U in the scalar type above can be an
# optional type. It's just a little weird that you can get an empty
# sequence but have to check against a null. At least when chaining
# gozintas, we can define it as a monad (!?)

# What about nested generators?

>> list :: [
   ['a', 'man'], ['a', 'plan'], ['a', 'cam'], ['a', 'yak'],
   ['a', 'yam'], ['a', 'canal'], ['panama']
]
Ok.

# Consider the following Python expression:
# [ len(item) for sublist in list for item in sublist ]
# map(lambda sublist: map(lambda item: len(item), sublist), list)

# This would be expressed in L as:

>> list |> (sublist) -> { sublist |> (item) -> { item(.count) } }
[1, 3, 1, 4, 1, 3, 1, 3, 1, 3, 1, 5, 6]

# If, however, you don't want to flatten the list, as in the Python
# expression `[ [len(item) for item in sublist] for sublist in list ]`,
# you would write the following expression in L:

>> list => (sublist) -> { [ sublist => (item) -> { item(.count) } ] }
[[1, 3], [1, 4], [1, 3], [1, 3], [1, 3], [1, 5], [6]]

# Here, each sublist is iterated over and turned into a list
# QUESTION: Is there some sort of lazy evaluation with the lists?


What about nested comprehensions again?

>> (1 .. 4)(zip: (4 .. 7)) => ([x, y]) -> { [[x, y]] }
[[1, 4], [2, 5], [3, 6]]

>> (1 .. 4) => (x) -> { (4 .. 7) => (y) -> { [[x, y]] } }
[[1, 4], [1, 5], [1, 6], [2, 4], [2, 5], [2, 6], ...]

>> (1 .. 4)(product: (4 .. 7)) => ([x, y]) -> { [[x, y]] }
[[1, 4], [1, 5], [1, 6], [2, 4], [2, 5], [2, 6], ...]
```