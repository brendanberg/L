__ION__ All expressions are lazy. Identifiers are evaluated when needed

	>> a :: 1
	>> b :: 2
	>> lazy :: [a, b]
	>> lazy
	   [1, 2]
	>> eager :: [\a, \b]
	>> eager
	   [1, 2]
	>> a :: 3, b :: 4
	>> lazy
	   [3, 4]
	>> eager
	   [1, 2]

	>> a :: 1, b :: 2
	>> c :: a + b
	>> c
	   3
	>> a :: 3, b :: 4
	>> c
	   7

## Block Operations

- __`{a + b}`__ ≡ `{a} + {b}`  
- __`{a + \b}`__ ≡ `{a} + b`  
- __`{foo(a)}`__ ≡ `{foo}({a})`  
- __`{foo(\a)}`__ ≡ `{foo}(a)`  
- __`{foo(a + b)}`__ ≡ `{foo}({a} + {b})`  
- `{foo\(a + {b})}` ≡ __`{foo(\a + b)}`__ ≡ `{foo}(a + {b})`  
- `{foo(\a + \b)}` ≡ __`{foo\(a + b)}`__ ≡ `{foo}(a + b)`  


## Type expressions

- `[]` list
- `[:]` map
- `()->{}` function
- `[Text]` list of text values
- `[Integer:Text]` map of integer to text
- `(Integer)->{Integer}` function that takes an integer and returns an integer
- `()->{Integer}`
- `[Integer]` list of integer
- `[Symbol:String]` map of symbol to string
- `[()->{}]` list of functions
- `[()->{Integer}]` list of functions returning integer
- `[(Text)->{Integer}]`

With explicit eager override operator:

	a : 2, b : 3
	foo : (x){ x * b }
	foo : (x)->{ x * b }
	foo : (x)=>{ x * b }
	
	c : { foo(a + b) }
	\c => 15
	c(a: 5, b: 7) => 36
	b : 4
	\c => 18
	bar : (x){ x * a + \b }(x : 5)
	bar => 14

—

	> List.prototype : Match -> [
	=   (index) : {
	=     helper : (list, idx) -> {
	=       if (idx = 0) {
	=         this.value
	=       } ?? {
	=         helper(this.next, idx - 1)
	=       }
	=     }
	=     helper(this, index)
	=   }
	=   [head, tail...] : { [this(head)] + this[tail] }
	=   length : {
	=     if (this.next) { 1 + this.next length } ?? { 1 }
	=   }
	= }

—  

	>> List ls .length => (ls) {{
	-    [] -> { 0 },
	-    [*] -> { 1 },
	-    [*, a...] -> { 1 + a.length }
	-  }}
	>> List ls (0) => (ls) {{ [a, *...] -> { a } }}
	>> List ls (n) => (ls) {{ [*, b...] -> { b(n - 1) } }}
	>> List ls [hd, tl...] => { [ ls(hd) ] + ls[tail] }
	>> List ls .head => (ls) {{ [h, *...] -> { h }, * -> { _ } }}
	>> List ls .tail => (ls) {{ [*, t...] -> { t }, * -> { _ } }}

	>> things :: [1, 2, 3, 4, 5, 6]
	>> things.length
	   6
	>> things(4)
	   5
	>> things[0]
	   [1]
	>> things[1, 3, 5]
	   [2, 4, 6]

