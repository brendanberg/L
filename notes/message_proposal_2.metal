Console :: Runtime(import: .Console)

serve :: {{
	(0, echo_fiber) -> {
		Console(.out) <- ("Serve finished")

		# When the result of sending .Finished to the return fiber
		# resolves to _, the result signals to the scheduler that
		# this fiber has also completed.

		<- echo_fiber <- (.Finished)
	}
	(n, echo_fiber) -> {
		response :: <- echo_fiber <- (.Continue)
		response => (.Echo) -> { Console(.out) <- ("Serve received echo") }

		serve(n - 1, echo_fiber)
	}
}}

echo :: {{
	(.Finished) -> { Console(.out) <- ("Echo finished"), _ }
	(.Continue) -> {
		Console(.out) <- ("Echo received continue")
		.Echo
	}
}}

echo_fiber :: echo(.start)
serve(.start) <- (3, echo_fiber)

# Or: serve(.start) <- (3, echo(.start))
#-

serve :: {{
	(0) -> {
		System(.out) <- ("Serve finished")

		# When the result of sending .Finished to the return fiber
		# resolves to _, the result signals to the scheduler that
		# this fiber has also completed.

		return <- (.Finished)
	}
	(n) -> {
		# The (.fiber) method returns a reference to the fiber
		# a function is currently running on. (Similar to Erlang's self())

		# Alternatively, if a reference to the function of a current fiber
		# is sent over a channel, the runtime automatically converts the
		# the function reference to a fiber reference
		received :: return <- (.Return(serve))
		received => (.Return) -> { System(.out) <- ("Serve received return") }

		serve(n - 1)
	}
}}

return :: {{
	(.Finished) -> { System(.out) <- ("Return finished"), _ }
	(.Return(serve_fiber)) -> {
		System(.out) <- ("Return received serve")
		serve_fiber <- (.Return)
	}
}}

Runtime(.directory) <- (registerKey: .return, fiber: return(.start))

# Since the runtime is what also does bookkeeping about fibers, the
# call to serve(.start) will block until the return fiber has started
# and been registered

serve(.start) <- (4)

-#

#-

all :: {
	result_a :: a <- (.Message(1))
	result_b :: b <- (.Message(2))
	result_c :: c <- (.Message(3))
	[result_a, result_b, result_c]
}

random :: RandomGenerator(seed: 12345)
random <- (.next)

# Random generators are asynchronous sequences :)

-#