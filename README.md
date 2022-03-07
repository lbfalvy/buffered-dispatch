# Buffered Dispatch

Buffer function calls and dispatch them on servers as they become available

Think of a load balancer balancing a cluster of HTTP servers. It accepts
requests, dispatches them on the first available server, then
forward the response back to the client. This utility is a lot like that,
except it doesn't keep track of responses and servers signal when they're
ready to accept the next request explicitly

## Usage

Here we have constructed a buffered dispatch with two number arguments
and a number return value, representing a division operation.

```ts
import { bufferedDispatch } from 'buffered-dispatch'
const [requestDiv, serveDiv] = bufferedDispatch<[number, number], number>()
```

This would go in something like a HTTP request handler, an asynchronous
function that represents a client. Any number of clients can call
`request` concurrently

```ts
const result = await requestDiv(3, 5)
```

This is a grossly oversimplified server. Any number of servers can call
`serve` concurrently, they will be resolved as clients arrive. Once a
server and a client have been matched the dispatcher forgets about both
of them

```ts
while (true) {
	const { resolve, reject, args: [num, denom] } = await serveDiv()
	if (denom == 0) reject(new Error('Division by zero'))
	else resolve(num / denom)
}
```
