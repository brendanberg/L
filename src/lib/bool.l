#-
Implementation of Boolean Data Type
-#

# This needs more work.
BooleanType :: Protocol([
	(boolValue) -> Boolean
])

Boolean :: < True | False >

@(True) => { Boolean.True }
@(False) => { Boolean.False }

Boolean x ('!') -> (match: x, in:) [
	# Note that `(selector:) { block }` is a special
	# form of `(selector: { block })`

	(True) -> { False }
	(False) -> { True }
]

Boolean x ('/\\': y) -> (match: x, in:) [
	(True) -> { y }
	(False) -> { False }
]

Boolean x ('\\/': y) -> (match: x, in:) [
	(True) -> { True }
	(False) -> { y }
]

Boolean x ('==': y) -> (match: x, in:) [
	(True) -> { y(boolValue) }
	(False) -> { !(y(boolValue) }
]

Boolean x ('!=': y) -> { !(x == y) }

Boolean x (boolValue) -> { x }

