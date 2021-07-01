# A Metalanguage for L

## Additional Syntactic Forms

The metalanguage introduces four new syntactic forms.
The first form is the *Syntax [Wrapper]*. It

```
@{ <Expression> }
```

The second, *Pattern Definition* form introduces a *Syntax Class* with an
associated token pattern.

```
@ <SyntaxClass> ( <SyntaxPattern> )
```

Third, the *Macro Definition* form associates a token pattern with a macro body.

```
@ <MacroClass> ( <SyntaxPattern> ) => { <MacroBody> }
```

Finally, the *Macro Incantation* form ...

```
@ <MacroClass> { <TokenList> }
```
