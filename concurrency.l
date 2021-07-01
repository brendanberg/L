# Even with basic value types, L is surprisingly powerful.
# But it's hard to take a programming language seriously in
# 2018 without intuitive concurrency semantics.

# In L, objects are the primary mechanism of concurrency.
# Objects are blocks with internal state that expose behavior
# by accepting messages.

# When a programmer invokes the '(run.)' selector on an object,
# a new stack is allocated for the object and a channel is
# returned as a line of communication into the object.

# (Are channels first-class values?)

# ----------------------------------------------------------------------------
# Consider the trivial function:

void :: () => { _ }

# We can tell the function to run in an environment
# different from this one using the '(.run)' selector:

fiber :: void(run.)               # or (go.) or (launch.) ?

# The function hasn't been run yet though. The fiber is
# waiting for someone to send it a message. We can send a
# message to a fiber using the '<-' operator:

result? :: fiber <- ()
result ?? 'nothing happened :('   # equals 'nothing happened :('

# This wasn't very interesting. Let's try a less trivial function:

double :: (x) => { x * 2 }
fiber :: double(run.)

ten? :: fiber <- (5)
ten ?? 'oops!'                    # equals 10

# Now that's more like it!

# Let's look at a more sophisticated use case. Suppose we wanted to
# parse an IP address in dotted quad notation, like 192.168.1.17.
# One approach would be to spit the text into an array of characters
# and send each character in a message to a number detector. The
# number detector appends each number it finds

address :: '192.168.1.17'

numberDetector :: (chan) => {
	buffer :: ''
	{{
		(char) => ('0123456789'(contains: char)) ?? { buffer(append: char) }
		('.') => { chan <- (buffer), buffer :: '' }
		()
	}}
}

resultCollector :: { [Text] list :: [], (Text num) => { list(append: num) }(.run) }

scanner :: numberDetector -> resultCollector

# The stream operator 'a ]> b' is just shorthand for 'a(b(.run))(.run)'

# Putting a fiber in square brackets collects the values:

result? :: [ a -> b ]

# Is the same as

chan :: a(b(run.))(run.)
collector :: { $T list :: [], ($T item) => { list(append: item) } }
collector

[ address(split: '')(iterator.) ]

quad? :: address(split: '')(iterator.) ]> numberDetector ]> resultCollector
quad? :: [ address(split: '')(emitter.) -> numberDetector ]
