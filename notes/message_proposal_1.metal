Console :: Runtime(import: .Console)

serve :: {{
	(0, echo_fiber) => {
		Console.out <- ('Serve finished')
		receive_fiber <- (.Finished)
	}
	(n, echo_fiber) => {
		<-Console.out('Serve sent \{n}')
		<-receive_fiber(.Continue(n, serve))
	}
}}

receive :: {{
	(.Finished) => { Console.out <- ('Echo finished'), _ }
	(.Continue(n, serve_fiber)) => {
		Console.out <- ('Echo received \{n}')
		serve_fiber <- (n - 1, echo)
	}
}}

echo_fiber :: echo(.start)
serve(.start) <- (3, echo_fiber)

# echo_fiber has type Fiber << (.Finished | .Continue(Number, Fiber)) => << Future | _ >> >>
# Fiber (($T)->$U) << >> [

# ]
# [Message($T):Fiber] mailbox, ($T)->$U implementation >>
#
# Fiber ($T)->$U fiber (message: Message $T message, sender: Fiber sender) -> $U {
#     fiber.mailbox + [message: sender]
# }
#
# Fiber ($T)->$U fiber (.run) -> {
#     
# }
