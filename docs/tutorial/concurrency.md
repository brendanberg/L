# Concurrency in L

- Actor semantics

Blocks have a `(.go)` or `(.spawn)` method which starts the actor in an independent fiber.
The result of a spawned actor is a future that does not resolve until the acto

- Transparent futures

Any expression that is awaiting a response from another actor evaluates to a future.
Any expressions relying on an actual value will automatically be rewritten as a block
that executes upon completion of the future.

Actors that conform to generator interface automatically get the standard sequence methods defined.

Start, send, recieve


Type of `[_, 'foo'](join: ' ')` is `Text?`
Type of `[_ ?? 'bar', 'foo'](join: ' ')` is `Text`

```
greeting? :: query(.result)   # Type of `greeting` is `Text?`
[greeting, 'foo'](join: ' ')  # Type of expression is `Text?`

```

```
{
	Console.out ! "Hello!"
}(.go)

fiber :: { 'hello' }(.run)
result? :: fiber(.result)        # `result` is "blocked" until the fiber completes
[result ?? 'greetings', 'world!'](join: ' ')    # This expression will get rewritten:

	{{ 
		(.Ok(result)) -> { [result, 'world!'](join: ' ') }
		(.Error(err)) -> { ['greetings', 'world!'](join: ' ') }
	}}




generator :: { 1..100 (yieldEach:){ $0 } }(.run)

chan :: Channel()

streamProcess :: (c)->{ c * c }(.run)

accumulator :: {
	acc :: 0
	{{
		# Referencing acc in the match body creates a closure 
		(incr: n) -> { acc :: acc + n, acc }
		(decr: n) -> { acc :: acc - n, acc }
	}}(.run)
}()
# acc is not accessible here, but accumulator!(incr: 3) will increment acc by 3 and yield the result

# evaluates block 

()->{ }()
{ }()

()->{ }(.run)


accumulator!(.inc)

asyncFn :: (x)->{ x * 2 }(.run)
result? :: asyncFn ! (3)

asyncFn :: (x)->{ Runtime(error: 'oops') }(.try)
result :: asyncFn ! (3)

(result){{
	(.Error(e)) -> { System(print: e) }
	(.Some(n)) -> {  }
}}

Int | _
Int | .Error(Text) | _


asyncBlock :: { really_long_computation(\x) }(.run)
result? :: asyncBlock ! ()

[ModuleType: MyType, ModuleSubtype: MySubtype] :: Runtime(import: 'geom')

My

a :: streamProcess <~ (4)

val? :: <~ generator

generator(map:)(c)->{ c * c }

# Future([2, 4, 6, ..., 200])

Actor << .Pending | .Running | .Waiting | .Completed($) >>
#                                         ^-----------^

Message << .Pending | .Completed($) >>

Optional << .Some($) | .None >>

```
