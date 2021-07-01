Datagram (Binary) <<
	4    # IP Version
	4    # Header length
	8    # Service type
	16   # Total length
	16   # ID
	3    # Flags
	13   # Fragment
	8    # TTL
	8    # Protocol
	16   # Header checksum
	32   # Source IP
	32   # Destination IP
>>

IPv4 :: 4

dgramSize :: dgram(byteLength.)

dgram -> {{
	(Datagram(\IPv4, hdrLen, svcType, totLen, id, flags, fragOff, ttl, proto, hdrChksum, srcIP, destIP)) ?
			(hdrLen >= 5 /\ hdrLen * 4 <= dgramSize) -> {
		# FOO
		Binary data :: dgramRest
	}
}}
