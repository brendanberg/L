

Expr($a) (#- Show, -# Comparable, Functor) :: <<
| .Bind($a, $a)
| .MachineType([Integer])
| .RecordType([.Identifier])
| .UnionType([.Tuple])
| .Method()
| .MessageSend($a, [$a: $a])
| .Call($a, [$a])
| .SymbolLookup($a, .Symbol)
| .SequenceAccess($a, [$a])
| .Immediate($a)
| .Block([$a])
| .HybridFunction([.Predicate])
| .Predicate([$a], $a, .Block)
| .List([$a])
| .Map([$a: $a])
| .PrefixExpr(Op, $a)
| .InfixExpr($a, Op, $a)
| .Identifier(Text)
| .Symbol(Text)
| .MetaVar(Text)
| .Text(Text)
| .Integer(Integer)
| .Decimal(Decimal)
| .Scientific(Scientific)
| .Complex(Complex)
| .Bottom
>>

Op :: << Text label >>

Op.label -> {{
    ("::") => {}
    ("...") => {}
    ("..|") => {}
    ("..") => {}
    ("->") => {}
    ("~>") => {}
    ("=>") => {}
    (":>") => {}
    ("<~") => {}
    ("|>") => {}
    ("<|") => {}
    ("??") => {}
    ("//:") => {}
    ("/\\") => {}
    ("\\/") => {}
    ("\\") => {}
    ("/:") => {}
    ("+:") => {}
    ("-:") => {}
    ("*:") => {}
    ("%:") => {}
    ("<=") => {}
    ("==") => {}
    ("!=") => {}
    (">=") => {}
    ("//") => {}
    ("@") => {}
    ("+") => {}
    ("-") => {}
    ("!") => {}
    ("**") => {}
    ("*") => {}
    ("/") => {}
    ("%") => {}
    ("<") => {}
    (">") => {}
    ("<*") => {}
    ("*>") => {}
    ("&") => {}
    ("|") => {}
    ("^") => {}
    (":") => {}
    ("~") => {}
}}

Term<<$f>> :: << .($f Term <<$f>>) >>

Term.In(Expr.Bottom)
# |- Term Expr
Term t (out.) => t -> {{
    (.(x)) => { x }
}}

tm :: Term.In(Expr.Bottom)
tm(out.) # Expr.Bottom

Node :: Term Expr

Functor node (bottomUp: transform) => {
    Term.In(transform(node(out.)(map: (bottomUp: transform))))
    # transform(node(map: (bottomUp: transform)))

}

Functor node (topDown: transform) => {
    Term.In(transform(node(out.))(map: (topDown: transform)))
    # transform(node)(map: (topDown: transform))
}

Node n (flattenTerm.) => (n) -> {{
    (Expr.Paren(e)) => { e }
    (other) => { other }
}}

Node n (flatten.) => { n(bottomUp: (flattenTerm.)) }
