### Connecting to the Server
You can connect to the CloudVision API server with any kind of WebSocket. This connector uses the regular browser WebSocket, but it also allows you to pass in your own custom implementation of a standard WebSocket.

You can also connect via secure WebSockets (`wss`), which uses the same SSL certificate as `https` does.

If you are using wss, you will need to get the authentication cookie from the CVP auth service.
```js
const authUrl = 'https://example.cloudvision.api-server/cvpservice/login/authenticate.do';
const userId = 'user';
const password = 'my-password';

function loggedIn() {
  console.log('You are logged in');
}

function authFailure(message) {
  console.log('Auth Failure:', message);
}

window.fetch(
  authUrl,
  {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({ userId, password }),
  }
).then(
  (response) => {
    // Handle JSON response
    return response.json();
  }
)then(
  (jsonResp) => {
    if (jsonResp.sessionId) {
      // We got a session id, so we are now logged in
      loggedIn();
    } else if (jsonResp.errorMessage) {
      // Handle authentication failure
      authFailure(jsonResp.errorMessage);
    }
  }
).catch(
  // Error handling for failed request
);
```
Once you have completed this request successfully, you will have the authentication cookie which will be sent along with the request to open the WebSocket.

```js
// Import module
import Connector from 'cloudvision-connector';

// Create the connection
const connector = new Connector();

// Start the connection
connector.run('ws://example.cloudvision.api-server/api/v2/wrpc/');

// Start the connection with a custom WebSocket
class CustomWS extends WebSocket {
 ...
};

const connectorWithCustomWS = new Connector(CustomWS);
connectorWithCustomWS.runWithWs('ws://example.cloudvision.api-server/api/v2/wrpc/');

// Start a secure authenticated connection. NOTE: the `wss` vs `ws`
connector.run('wss://example.cloudvision.api-server/api/v2/wrpc/');
```

### Listening to the Connection Status
The `Connector.connection` function adds a status-accepting callback to a `Connector` and returns an unbinding function that may be used to remove the callback. The status passed to the callback is either `Connector.CONNECTED`, or `Connector.DISCONNECTED`. Additionally, the WebSocket event (see WebSocket documentation) is passed as the second argument.

- `Connector.CONNECTED` is emitted once the WebSocket connection has been established and the client is authenticated. At this point requests can be sent and the server will start sending responses.
- `Connector.DISCONNECTED` is emitted when the WebSocket is hung up.

#### Example
```js
function statusCallback(status, wsEvent) {
  switch (status) {
    case Connector.CONNECTED:
      // react to connected event
      break;
    case Connector.DISCONNECTED:
      // react to disconnected event
      break;
  }
}

// Add callback
const unbindStatus = connector.connection(statusCallback);
...
// Remove callback when done
unbindStatus();
```

Multiple callbacks may be added to a given `Connector` via `Connector.connection`:

```js
// This is es6 arrow function notation (shortcut for function() {} )
const callback1 = (status) => {...}
const callback2 = (status) => {...}
const unbind1 = connector.connection(callback1)
const unbind2 = connector.connection(callback2)
```

Callbacks will be called in the order in which they were added.
