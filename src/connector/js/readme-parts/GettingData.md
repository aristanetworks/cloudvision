### Getting Datasets
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

### Getting Data
The CloudVision Connector allows you to query notifications for multiple paths on a dataset, as well as multiple paths within multiple datasets.

#### getWithOptions(query, callback, [options])
Returns all notifications that match the given query and options.

  - `query`: an object in the shape of a query (see "Query")
  - `callback`: a function that is called when notifications are received (see "Notifications Callback")
  - `options` (optional): an object in the shape of query options (see "Options")

### Subscribing to Data
In addition to getting data, you can use the same query to subscribe to any updates to the data as it changes.

#### getAndSubscribe(query, callback, [options])
Returns all notifications that match the given query and options, in addition to subscribing to updates. This will return notifications as new updates to the data requested come in.

  - `query`: an object in the shape of a query (see "Query")  
  - `callback`: a function that is called when notifications are received (see "Notifications Callback")
  - `options` (optional): an object in the shape of query options (see "Options")
  - **Returns**: a function that unbinds (closes) the subscription.

#### Example
```js
const query = [{
  dataset: {
    type: 'app',
    name: 'analytics'
  },
  paths: [{
    type: 'EXACT',
    path: '/events/activeEvents',
  }],
}, {
  dataset: {
    type: 'device',
    name: 'JAS11070002'
  },
  paths: [{
    type: 'EXACT',
    path: '/Eos/image',
  }, {
    type: 'EXACT',
    path: '/Logs/var/log/messages',
  }],
}];
const handleResponse = (err, res, status) => {...};

// open the stream
const closeSubscription = connector.subscribe(query, handleResponse);

closeSubscription(); // close the stream when finished
```

### Notifications Callback
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
        "path/to/some/data":    [...],
        "path/to/another/data": [...],
        ...
      }
    }
    ```
    Each `[...]` above is an array of notifications which each have a `timestamp`, `path`, collection of `updates`, and `deletes` (see "Data Model" section for more information).
  - status: An object with the status code and a message. See the "Notification Statuses" section for more details.
  - `token`: The token id that was created for the request.

### Notification Statuses
A status object has an optional `message` key containing a string describing the status, in addition to a `code` key with the code number.

Possible status codes:
|Code|JS Constant|Description|
|1001|EOF_CODE|Signals that this is the last notification for the request|
|3001|ACTIVE_CODE|Signals that the stream (subscription), has been established|

### Options
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

### Query
A query is an array of objects with a **dataset** key and a **paths** key. The value of each **dataset** is an object with a **type** (the type of the dataset, which can be **device** or **app**) and **name** (the identifier for the dataset e.g. 'JPE13262133') key. The value of the **paths** key is an array of objects with a **type** (can be **EXACT** or **REGEXP**) and **path** (the stringified version of the path e.g. '/Eos/image') key.

```js
query = [{
  dataset: {
    type: <dataset type>,
    name: <dataset>,
  },
  paths: [{
    type: <path type>,
    path: <path 1>,
  }, {
    type: <path type>,
    path: <path 2>,
  }],
}];
```

#### Example
```js
const handleResponse = (err, res) => {...};
const query = [{
  dataset: {
    type: 'app'.
    name: 'analytics',
  },
  paths: [{
    type: 'EXACT',
    path: '/events/activeEvents',
  }],
}];
const options = {
  start: 1504113817725,
  end: 1504113917725,
};

connector.getWithOptions(query, null, options, handleResponse);
```
