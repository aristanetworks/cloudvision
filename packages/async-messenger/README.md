# `async-messenger`

`async-messenger` is a Promise-based solution for sending serialized messages, written in
TypeScript.
All messages are encoded before transmission (defaults to `JSON.stringify` / `JSON.parse`).

```ts
import AsyncMessenger from 'async-messenger';

// Messenger A sends messages of type 'INTRODUCE'
type MessagesFromA = {
  INTRODUCE: { // Message type string
    request: string; // Type of data sent with request
    response: string; // Type of data returned in response
  };
};

// Messenger B sends no messages, only receives
type MessagesFromB = {};

// Create messengers
const messengerA = new AsyncMessenger<MessagesFromA, MessagesFromB>();
const messengerB = new AsyncMessenger<MessagesFromB, MessagesFromA>();

// Define how messengers are to send their serialized messages
// For this example, send serialized messages directly to `receive` method of other messenger
messengerA.setSendMessage((message) => messengerB.receive(message));
messengerB.setSendMessage((message) => messengerA.receive(message));

// Set up message handlers for recipient
messengerB.addRequestHandler('INTRODUCE', (name) => {
  if (introduced.includes(name)) {
    throw Error("We've already met!");
  }
  introduced.push(name);

  return 'Welcome!';
};

// Send a message and handle the response
messengerA
  .send('INTRODUCE', 'Bob')
  .then((response) => {
    // "Welcome!"
    console.log(response);
  })
  .catch((error) => {
    // "We've already met!"
    console.error(error.message);
  });
```

## Method Chaining

`setSendMessage` and `addRequestHandler` return the messenger instance, allowing method calls to be
chained.

```ts
const messengerB = new AsyncMessenger<MessagesFromB, MessagesFromA>()
  .setSendMessage((message) => messengerA.receive(message))
  .addRequestHandler('INTRODUCE', () => 'Welcome!');
```

## Handler Promises

Message handlers can return a `Promise` that resolves with the expected data, or rejects with an
error.
If an error is thrown by the handler, the request `Promise` will reject.

```ts
messengerB.addRequestHandler('INTRODUCE', (name) => {
  return new Promise((resolve, reject) => {
    // Wait for 1 second before responding
    setTimeout(() => {
      if (introduced.includes(name)) {
        reject(Error("We've already met!"));
      } else {
        introduced.push(name);
        resolve('Welcome!');
      }
    }, 1000);
  });
});
```

## Request Timeouts

Messages can be sent with a timeout duration.
The request will reject if no response is received before the timeout elapses.

```ts
messengerA
  .send('INTRODUCE', 'Bob', 100)
  .then((response) => {
    console.log(response);
  })
  .catch((error) => {
    // "Timeout after 100ms"
    console.error(error.message);
  });
```

## Custom Encoding

The default encoding and decoding functions can be overridden by passing an encoder and decoder to
the constructor.
The encoder must return a string, and the decoder must process a string.

```ts
const messengerA = new AsyncMessenger<MessagesFromA, MessagesFromB>(JSON.stringify, JSON.parse);
```

Make sure that you also define the custom encoding and decoding for the other messenger.

## Usage With Web Workers

In order to use messengers with Web Workers, messages need to be sent through the `postMessage` and
`onmessage` [methods](https://developer.mozilla.org/en-US/docs/Web/API/Worker) of the worker and its
client.
These can then be linked to a pair of messengers.

We can create a shared types file to access the message types in both files.

`messageTypes.ts`:
```ts
/** Messages sent from client to worker. */
export type ClientMessages = { ... };

/** Messages sent from worker to client. */
export type WorkerMessages = { ... };
```

We can then import the types into the worker client and worker when defining our messengers.

`myWorkerClient.ts`:
```ts
import { ClientMessages, WorkerMessages } from './messageTypes';
import Worker from './myWorker.worker';

const messenger = new AsyncMessenger<ClientMessages, WorkerMessages>();

// Send messages from messenger to worker
messenger.setSendMessage((message) => worker.postMessage(message));

// Pass messages from worker to messenger
worker.onmessage = (event) => messenger.receive(event.data);
```

`myWorker.worker.ts`:
```ts
import { ClientMessages, WorkerMessages } from './messageTypes';

const messenger = new AsyncMessenger<WorkerMessages, ClientMessages>();

// Send messages from messenger to client
messenger.setSendMessage((message) => self.postMessage(message));

// Pass messages from client to messenger
self.onmessage = (event) => messenger.receive(event.data);
```
