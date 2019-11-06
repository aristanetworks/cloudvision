# Data Model

## Notifications

A notification object contains a timestamp, path, collection of updates, and collection of deletes:

```
{
  "timestamp": <timestamp>,
  "path":      <path>,
  "updates":   {<update>, <update>, ...},
  "deletes":   {<delete>, <delete>, ...}
}
```

The `<timestamp>` is a Unix nanosecond value which indicates the creation time of the notification.

The `<path>` is an array of path elements that designates the notification's position within a dataset. A path element can be a string, number, or complex value.

Each `<update>` is a named key-value pair:

```
<name>: {
  "key": <key>,
  "value": <value>
}
```

The value of `<key>` and `<value>` is a number, boolean, string, or object.

The value of `<name>` is a string generated from the key:

| Type    | `<key>`                                           | `<name>`        |
| ------- | ------------------------------------------------- | --------------- |
| Number  | `1234`                                            | `"1234"`        |
| Boolean | `true`                                            | `"true"`        |
| String  | `"foo_bar"`                                       | `"foo_bar"`     |
| Object  | `{ "1": "foo", "2": "bar" }`                      | `"foo_bar"`     |
| Object  | `{ "1": { "1": "foo", "2": "bar" }, "2": "baz" }` | `"foo_bar_baz"` |

A special kind of update points to another path:

```
<relative>: {
  "key": <relative>,
  "value": { "_ptr": <absolute> }
}
```

The value of `<relative>` is a descendant path name relative to the path of the
notification, and the value of `<absolute>` is the name of this path relative to `/`.
Here are some examples to demonstrate this:

| `<path>`     | `<relative>`   | `<absolute>`   |
| ------------ | -------------- | -------------- |
| `[]`         | `"A"`          | `["A"]`        |
| `["A"]`      | `"b"`          | `["A", "b"]`   |
| `["A", "b"]` | `{"foo": "bar"}` | `["A", "b", {"foo": "bar"}]`   |

Each `<delete>` is a named key that has been removed from the path:

```
<name>: <key>
```

If the `"deletes"` key is absent from a notification, that means that
there were no deletes:

```
{
  "timestamp": <timestamp>,
  "path": <path>,
  "updates": {<update>, <update>, ...}
}
```

If the `"deletes"` key is present and corresponds to an empty collection,
then that means that all keys for the path of the notification were removed:

```
{
  "timestamp": <timestamp>,
  "path": <path>,
  "deletes": {}
}
```

### Queries
A query is an array of objects, where each object has the following shape:
```
{
  "dataset": <dataset>,
  "paths": [<path>, ...],
}
```

The `<dataset>` is an object:
```
{
  "type": <device type>,
  "name": <device type>
}
```
where `<device type>` is **device** or **app**.

The `<path>` is an object:
```
{
  "type": <type>
  "path": <path>,
}
```
where `<type>` is **EXACT** or **REGEX** and `<path string>` is a string that designates the notification's position within a dataset.

```
[
  { "dataset": <dataset>, "paths": [<path>, <path>] },
  { "dataset": <dataset>, "paths": [<path>, <path>] },
  ...
]
```

Each path in a query corresponds to a (possibly empty) collection of notifications in
the dataset to which the path is mapped.

#### Options

Options are a collection of key-value pairs that are used to modify a query:

```
{
  <option>: <value>,
  <option>: <value>,
  ...
}
```

These are the currently supported options:

| `<option>`   | `<value>`     | Description                           |
| ------------ | ------------- | ------------------------------------- |
| `"start"`    | `<timestamp>` | The timestamp of the first datapoint  |
| `"end"`      | `<timestamp>` | The timestamp of the last datapoint   |
| `"versions"` | number        | The number of versions of data        |
| `"_count"`   | boolean       | Output the number of updates per path |

#### Examples

To get the latest notifications for a path, specify no options:

```
{
  "query": [
    { dataset: <dataset>, paths: [<path>] },
    { dataset: <dataset>, paths: [<path>] },
    ...
  ],
}
```

To get the notifications at a specific time:

```
{
  "query": [
    { dataset: <dataset>, paths: [<path>] },
    { dataset: <dataset>, paths: [<path>] },
    ...
  ],
  "end": <timestamp>
}
```

To get the notifications within a specific time range:

```
{
  "query": [
    { dataset: <dataset>, paths: [<path>] },
    { dataset: <dataset>, paths: [<path>] },
    ...
  ],
  "start": <timestamp>,
  "end": <timestamp>
}
```

To get a specific number of versions of the latest set of notifications:

```
{
  "query": [
    { dataset: <dataset>, paths: [<path>] },
    { dataset: <dataset>, paths: [<path>] },
    ...
  ],
  "versions": <timestamp>
}
```

To get a specific number of versions of a set of notifications at a specific time:

```
{
  "query": [
    { dataset: <dataset>, paths: [<path>] },
    { dataset: <dataset>, paths: [<path>] },
    ...
  ],
  "versions": <timestamp>,
  "end": <timestamp>
}
```

To show the updates per notification returned from the query:

```
{
  "query": [
    { dataset: <dataset>, paths: [<path>] },
    { dataset: <dataset>, paths: [<path>] },
    ...
  ],
  "_count": true
}
```
