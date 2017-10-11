# REST API Reference

REST commands are handled at `/api/v1/rest` over HTTPS:

| Command               | URI                                                     | Description                                                                       |
| --------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------- |
| getDatasets           | `/`                                                     | Get a list of datasets.                                                           |
| getNotifications      | `/<dataset>/<path>`                                     | Get latest notifications for a path in a dataset.                                 |
| getNotificationsRange | `/<dataset>/<path>?start=<timestamp>&end=<timestamp>`   | Get notifications within a time range.                                            |
| getNotificationsLimit | `/<dataset>/<path>?end=<timestamp>&versions=<number>`   | Get the specified number of versions for the notifications at the given end time. |

If `end` is not provided in getNotificationsLimit, then it defaults to the current time. If `versions` is not
provided, it defaults to one. Additionally, the option `pretty` can be used with any of the above commands to
pretty-print the response.

#### Examples

GET `/?pretty`:

```
["Time", "Space"]
```

GET `/Time?pretty`:

```
{
  "notifications": [
    {
      "timestamp": 100000000000,
      "path": "/",
      "updates": {
        "key": "Elapsed",
        "value": {
          "_ptr": "/Elapsed"
        }
      }
    },
    ...
  ]
}
```

GET `/Time/Elapsed?pretty`:

```
{
  "notifications": [
    {
      "timestamp": 100000000100,
      "path": "/Elapsed",
      "updates": {
        "key": "milliseconds",
        "value": 100
      }
    },
    {
      "timestamp": 100000000100,
      "path": "/Elapsed",
      "updates": {
        "key": "seconds",
        "value": 1
      }
    }
  ]
}
```

GET `/Time/Elapsed?start=100000000000&end=100000000099&pretty`:

```
{
  "notifications": [
    {
      "timestamp": 100000000001,
      "path": "/Elapsed",
      "updates": {
        "key": "milliseconds",
        "value": 1
      }
    },
    {
      "timestamp": 100000000002,
      "path": "/Elapsed",
      "updates": {
        "key": "milliseconds",
        "value": 2
      }
    },
    ...,
    {
      "timestamp": 100000000099,
      "path": "/Elapsed",
      "updates": {
        "key": "milliseconds",
        "value": 99
      }
    }
  ]
}
```

GET `/Time/Elapsed?start=100000000000&end=100000000100&pretty`:

```
{
  "notifications": [
    {
      "timestamp": 100000000001,
      "path": "/Elapsed",
      "updates": {
        "key": "milliseconds",
        "value": 1
      }
    },
    {
      "timestamp": 100000000002,
      "path": "/Elapsed",
      "updates": {
        "key": "milliseconds",
        "value": 2
      }
    },
    ...,
    {
      "timestamp": 100000000100,
      "path": "/Elapsed",
      "updates": {
        "key": "milliseconds",
        "value": 100
      }
    },
    {
      "timestamp": 100000000100,
      "path": "/Elapsed",
      "updates": {
        "key": "seconds",
        "value": 1
      }
    }
  ]
}
```

GET `/Time/Elapsed?versions=3&end=100000000100&pretty`:

```
{
  "notifications": [
    {
      "timestamp": 100000000098,
      "path": "/Elapsed",
      "updates": {
        "key": "milliseconds",
        "value": 98
      }
    },
    {
      "timestamp": 100000000099,
      "path": "/Elapsed",
      "updates": {
        "key": "milliseconds",
        "value": 99
      }
    },
    {
      "timestamp": 100000000100,
      "path": "/Elapsed",
      "updates": {
        "key": "milliseconds",
        "value": 100
      }
    },
    {
      "timestamp": 100000000100,
      "path": "/Elapsed",
      "updates": {
        "key": "seconds",
        "value": 1
      }
    }
  ]
}
```
