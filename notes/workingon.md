

Language & Runtime for Distributed Systems

- Purely functional core
- Logical type system
- OO / CSP communication layer

In-Memory Data Store

- Logical query language
- DB engine can execute functional operations (map, filter, reduce)
- Individual engines optimized for time series, graph, table-based data


L to do:
- String iterpolation syntax
- Nested functions (`(x)->(y)->{x + y}`)
- Element access in maps as function call
- Tail call elimination

- Pattern matching on machine types
- Casting to machine types
- Concurrency primitives
- Map destructuring bugs 
- Method purity (no identifiers may resolve outside of impl)