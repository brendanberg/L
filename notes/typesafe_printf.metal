

Format << .Int(Format)
		| .Text(Format)
		| .Other(Text, Format)
		| .End
		>>
	
Text self (format.) -> (self) : {{
	(['%', 'd', cs...]) -> { Format.Int(cs(format.)) }
	(['%', 's', cs...]) -> { Format.Text(cs(format.)) }
	([c, cs...]) -> { Format.Other(c, cs(format.)) }
	([]) -> { Format.End }
}}

Text self (format.) -> (self) : {{
	('%' ++ 'd' ++ cs) -> { Format.Int(cs(format.)) }
	('%' ++ 's' ++ cs) -> { Format.Text(cs(format.)) }
	(c ++ cs) -> { Format.Other(c, cs(format.)) }
	([]) -> { Format.End }
}}

Format self (iterpret.) -> (self) : {{
	(.Int(f)) -> { Int -> f(interpret.) }
	(.String(f)) -> { Text -> f(interpret.) }
	(.Other(_, f)) -> { f(intepret.) }
	(.End) -> { Text }
}}

Format self (toFunction: Text t) -> (self, t) : {{
	(.Int(f), a) -> {  }
	(.String(f), a) -> { (s) -> { f(toFunction: ) } }
	(.Other(c, f), a) -> { f(toFunction: a(append: c)) }
	(.End, a) -> { a }
}}

Text txt (printf.) -> { s(format.)}



Text self (printf.) -> {
	self(format.)(toFunction.)
}

Format self (toFunction.) -> (self) : {{
	(.Int(f)) -> {
		(args...) -> { body } :: f(toFunction.)
		(Integer i)-> }
}}