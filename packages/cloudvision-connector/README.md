# CloudVision Connector

The CloudVision Connector is a simple JavaScript module using WebSockets that enables you to transmit data over an open connection with the CloudVision API server. The CloudVision Connector supports subscribing to data, which lets clients receive streaming updates as data changes in real-time.

## Installation

with yarn:

```bash
yarn add cloudvision-connector
```

or npm:

```bash
npm install --save cloudvision-connector
```

## Usage

### Getting Started

Quick introduction into to how to connect to the API server

#### Getting Datasets
```js
const parseDatasets = (err, datasets) => {...};
// Add a callback
connector.getDatasets(parseDatasets);

// datasets returned in `parseDatasets` is a list of dataset ids
datasets = [
  'JPE15076475',
  'JPE12111270',
  'app-turbine',
  'HSH14525062',
  'CloudTracer',
];
```

You can also get datasets use `getWithOptions` (see details below). This is done by calling `getWithOptions` with `Connector.DEVICES_DATASET_ID` as the first parameter.
```js
const parseDevices = (err, datasets) => {...};
const query = Connector.DEVICES_DATASET_ID;

connector.getWithOptions(query, handleResponse);
```

#### Getting Data
The CloudVision Connector allows you to query notifications for multiple paths on a dataset, as well as multiple paths within multiple datasets.

##### getWithOptions(query, callback, options)
Returns all notifications that match the given query and options.

  - `query`: an object in the shape of a query (see "Query")
  - `callback`: a function that is called when notifications are received (see "Notifications Callback")
  - `options`: an object in the shape of query options (see "Options")
  - **Returns**: the token (unique identifier) of the request.
##### Example
```js
const query = [{
  dataset: {
    type: 'app',
    name: 'analytics'
  },
  paths: [{
    path_elements: ['events','activeEvents'],
  }],
}, {
  dataset: {
    type: 'app',
    name: 'analytics'
  },
  paths: [{
    path_elements: ['tags','stats'],
  }, {
    path_elements: ['BugAlerts','bugs'],
  }],
}];
const handleResponse = (err, res, status) => {...};
const options = {
  start: 1504113817725,
  end: 1504113917725,
};

// open the stream
const token = connector.getWithOptions(query, handleResponse), options;
```

#### Subscribing to Data
In addition to getting data, you can use the same query to subscribe to any updates to the data as it changes.

##### getAndSubscribe(query, callback, options)
Returns all notifications that match the given query and options, in addition to subscribing to updates. This will return notifications as new updates to the data requested come in.

  - `query`: an object in the shape of a query (see "Query")
  - `callback`: a function that is called when notifications are received (see "Notifications Callback")
  - `options`: an object in the shape of query options (see "Options")
  - **Returns**: a the subscription identifier. This is an object constaining the token and the callback

##### Example
```js
const query = [{
  dataset: {
    type: 'app',
    name: 'analytics'
  },
  paths: [{
    path_elements: ['events','activeEvents'],
  }],
}, {
  dataset: {
    type: 'app',
    name: 'analytics'
  },
  paths: [{
    path_elements: ['tags','stats'],
  }, {
    path_elements: ['BugAlerts','bugs'],
  }],
}];
const handleResponse = (err, res, status) => {...};

// open the stream
const subscribptionsIdentifier = connector.subscribe(query, handleResponse);
```

#### Notifications Callback
This is the callback, which is called when notifications are received.

```js
const handler = (err, res, status, token) => {...}
```

Arguments:
  - `err`: either a string or `null`. If `null` then there is no error. If it is a string, then an error occurred.
  - `res`: an object with the properties `dataset` and `notifications`.
    e.g.
    ```js
    res = {
      dataset: "someDevice",
      notifications: {
        "['path', 'to', 'some', 'data']":    [...],
        "['path', 'to', 'another', 'data']": [...],
        ...
      }
    }
    ```
    Each `[...]` above is an array of notifications which each have a `timestamp`, `path`, collection of `updates`, and `deletes` (see "Data Model" section for more information).
  - status: An object with the status code and a message. See the "Notification Statuses" section for more details.
  - `token`: The token id that was created for the request.

#### Notification Statuses
A status object has an optional `message` key containing a string describing the status, in addition to a `code` key with the code number.

Possible status codes:
|Code|JS Constant|Description|
|1001|EOF_CODE|Signals that this is the last notification for the request|
|3001|ACTIVE_CODE|Signals that the stream (subscription), has been established|

#### Options
There are a number of options you can supply to the query which limit it's scope. Options are passed as an object, where the **key** is the name of the option and the **value** is the value for that option.

The options are `start`, `end` and `versions`. There are different combinations of options that are valid, each of them is listed below.

Range query (returns one or more data points):
  - `start`: the epoch timestamp in (milliseconds) of the first data point.
  - `end`: the epoch timestamp in (milliseconds) of the last data point.

Point in time query (returns exactly one data point):
  - `end`: the epoch timestamp in (milliseconds) of the data point.

Limit query (returns `versions` + 1 number of data points):
  - `end`: the epoch timestamp in (milliseconds) of the last data point.
  - `versions`: the number of versions of data (in the past) to request in addition to the data point for `end`.

#### Query
A query is an array of objects with a **dataset** key and **paths** key.

The value of each **dataset** is an object with a **type** (the type of the dataset, which can be **device** or **app**) and **name** (the identifier for the dataset e.g. 'JPE13262133') key.

The value of the **paths** key is an array of objects with a **path_elements** (an array of the component parts of a path) key and an optional **keys** key. The value of **keys** is an object that defines the shape of how you want the data to be returned. Think of it like a map that points to certain fields in CloudVision api.

```js
query = [{
  dataset: {
    type: <dataset type>,
    name: <dataset>,
  },
  paths: [{
    path_elements: <path 1>,
  }, {
    path_elements: <path 2>,
    keys: {
      [any_custom_key]: {
        key: <key 1>,
      }
    }
  }],
}];
```

##### Example
```js
const handleResponse = (err, res) => {...};
const query = [{
  dataset: {
    type: 'app'.
    name: 'analytics',
  },
  paths: [{
    path_elements: ['events', 'activeEvents'],
  }, {
    path_elements: ['Logs', 'var', 'log', 'messages'],
    keys: {
      logMessage: {
        key: 'text',
      }
     }
  }],
}];
const options = {
  start: 1504113817725,
  end: 1504113917725,
};

connector.getWithOptions(query, null, options, handleResponse);
```

### Getting Data

More in depth information on how to query different data.

#### Connecting to the Server
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
).then(
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
connector.run('ws://example.cloudvision.api-server/api/v3/wrpc/');

// Start the connection with a custom WebSocket
class CustomWS extends WebSocket {
 ...
};

const connectorWithCustomWS = new Connector(CustomWS);
connectorWithCustomWS.runWithWs('ws://example.cloudvision.api-server/api/v3/wrpc/');

// Start a secure authenticated connection. NOTE: the `wss` vs `ws`
connector.run('wss://example.cloudvision.api-server/api/v3/wrpc/');
```

#### Listening to the Connection Status
The `Connector.connection` function adds a status-accepting callback to a `Connector` and returns an unbinding function that may be used to remove the callback. The status passed to the callback is either `Connector.CONNECTED`, or `Connector.DISCONNECTED`. Additionally, the WebSocket event (see WebSocket documentation) is passed as the second argument.

- `Connector.CONNECTED` is emitted once the WebSocket connection has been established and the client is authenticated. At this point requests can be sent and the server will start sending responses.
- `Connector.DISCONNECTED` is emitted when the WebSocket is hung up.

##### Example
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

## Data Endcoding
Data returned from the CloudVision APi is both JSON and NEAT (more strict MessagePack) encoded. Additionally NEAT encoded values are base64 encoded for transport. The notification body is JSON encoded, while `key` and `value` attributes of the notification are NEAT encoded. The parser inside the cloudvision-connector library takes care of decoding and encoding notifications for you. Note that when notifications are decoded they are decoded into an object keyed key the notification key. Since keys can be non strings, the key is the base64 NEAT encoded value. The value of this object contains both the decoded `key` and `value`.

## What is NEAT?
NEAT is MessagePack with some alterations listed below:
- All strings are binary encoded
- Maps and Object keys are encoded in order of binary value of the key. This means `{ a: 'b', c: 'd' }` and `{ c: 'd', a: 'b' }` are encoded as the same NEAT value.
- Support for pointer values via the `Pointer` extention type
- Support for wildcard values via the `Wildcard` extention type

## Try it out

To try out the CloudVision Connector in your browser, simply run

```shell
npm run clean-install
npm run build:try
```

Then open **index.html** in your browser. In the developer console
CloudVision Connector will be available as **window.CloudVisionConnector**.

### Examples

Create the connector: `conn = new window.CloudVisionConnector()`
Connect to an API server: `conn.run('ws://example.cloudvision.api-server/api/v2/wrpc/')`
Run a query: `conn.getWithOptions(window.CloudVisionConnector.DEVICES_DATASET_ID
, (err, res) => console.log(err, res))`

## Contributing

Contributing pull requests are welcomed for this repository. Please note that all contributions require 100% code test cases and 100% code coverage, otherwise the pull request will be rejected.

## License

The CloudVision Connector is [MIT licensed](LICENSE).
