#-
Implementation of Boolean Data Type
-#

#- Protocol declarations need more work.
BooleanType (boolValue.) -> Boolean
-#

Boolean :: << True | False >>

Boolean p ('!') -> {
	{{
		(.True) -> { Boolean.False }
		(.False) -> { Boolean.True }
	}} (p)
}

Boolean p ('/\\': q) -> {
	{{
		(.True) -> { q }
		(.False) -> { Boolean.False }
	}} (p)
}

Boolean p ('\\/': q) -> {
	{{
		(.True) -> { Boolean.True }
		(.False) -> { q }
	}} (p)
}

Boolean p ('==': q) -> {
	{{
		(.True) -> { q(boolValue.) }
		(.False) -> { !(q(boolValue.)) }
	}} (p)
}

Boolean p ('!=': q) -> { !(p == q) }

Boolean p (boolValue.) -> { p }
