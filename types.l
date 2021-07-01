# Type extensions

# A programmer can add additional behavior to a type simply by
# declaring new methods.
#
# - Define new instance and type methods
# - Make an existing type conform to a protocol

# QUESTION: Can a method be overridden? (Leaning towards no.)

Type t (foo: x, bar: y) -> { ... } 

# To explicitly declare conformance to a named protocol,

Type (Protocol) t ...

# --------

Either $L, $R << .Left($L) | .Right($R) >>

Option $T << .Some($T) | .Nothing >>

Option a (else: $T b) -> {{
    .Some($T x) -> { x }
    .Nothing -> { b }
}}

Option opt ('??': $T alt) -> (opt) :> {{
    (.Some($T val)) -> { val() }
    (_) -> { alt() }
}}

val :: struct (maybeGet: foo)

val ?? 'bar'

Option if :: {{ (.True) -> { c() }, (.False) -> { _ } }}

if (x < 0, { -x })

if :: {{
  (.True, c, _) -> { c() }
  (.False, _, a) -> { a() }
}}
if (!(x < 0), { 'positive' }, { 'negative' })

if (x < 0) { 'True' } else { 'False' }

[ Identifier('if'), Parenthesized exp, Block conseq, Identifier('else'), Block alt ]


Vector [2, 3]
Set [0, 1, 2, 3]

DefaultMap [.a: 1, .b: 2, .c: 3] { -1 }
