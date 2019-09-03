/* @flow */
// Copyright (c) 2018, Arista Networks, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software
// and associated documentation files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all copies or
// substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import msgpack from 'a-msgpack';
import { fromByteArray, toByteArray } from 'base64-js';

import { Codec } from './neat';
import type {
  CloudVisionBatchedNotifications,
  CloudVisionDatapoint,
  CloudVisionDatsets,
  CloudVisionDeletes,
  CloudVisionMessage,
  CloudVisionNotification,
  CloudVisionNotifs,
  CloudVisionParams,
  CloudVisionStatus,
  DatasetObject,
  PathElements,
  Query,
  WsCommand,
} from './utils';

type CloudVisionQueryMessage = {
  token: string,
  command: WsCommand,
  params: CloudVisionParams,
};

type Timestamp = {
  seconds: number,
  nanos?: number,
};

type RawCloudVisionDatapoint = {
  key: string,
  value: string,
};

type RawCloudVisionNotification = {
  path_elements?: Array<string>,
  timestamp: Timestamp,
  updates?: Array<RawCloudVisionDatapoint>,
  deletes?: Array<string>,
  delete_all?: Boolean,
};

type CloudVisionNotificationPublish = {
  path_elements: PathElements,
  timestamp: Timestamp,
  updates?: CloudVisionDatapoint,
  deletes?: CloudVisionDeletes,
};

type RawCloudVisionNotifs = {|
  dataset: DatasetObject,
  notifications: Array<RawCloudVisionNotification>,
|};

type RawCloudVisionMessage = {
  error?: string,
  result: RawCloudVisionNotifs | CloudVisionDatsets,
  status: CloudVisionStatus,
  token: string,
};

export function encodePathElements(pathElements: PathElements): Array<string> {
  const encodedPathElements = [];
  for (let i = 0; i < pathElements.length; i += 1) {
    encodedPathElements.push(fromByteArray(msgpack.encode(pathElements[i], Codec)));
  }

  return encodedPathElements;
}

export function encodePathElementsAndKeysInQuery(query: Query): Query {
  const encodedQuery = [];
  for (let i = 0; i < query.length; i += 1) {
    const encodedQueryItem = {
      dataset: query[i].dataset,
      paths: [],
    };
    const queryItem = query[i];
    for (let j = 0; j < queryItem.paths.length; j += 1) {
      const path = queryItem.paths[j];
      const encodedPath = {};
      const encodedKeys = [];
      if (path.keys && Array.isArray(path.keys)) {
        for (let k = 0; k < path.keys.length; k += 1) {
          encodedKeys.push(fromByteArray(msgpack.encode(path.keys[k], Codec)));
        }
        encodedPath.keys = encodedKeys;
      }
      encodedPath.path_elements = encodePathElements(path.path_elements);
      encodedQueryItem.paths.push(encodedPath);
    }
    encodedQuery.push(encodedQueryItem);
  }

  return encodedQuery;
}

export function decodePathElements(pathElements: Array<string>): PathElements {
  const decodedPathElements = [];
  for (let i = 0; i < pathElements.length; i += 1) {
    decodedPathElements.push(msgpack.decode(toByteArray(pathElements[i]), Codec, true));
  }

  return decodedPathElements;
}

function decodeNotifs(notif: Array<RawCloudVisionDatapoint>): CloudVisionDatapoint {
  const decodedNotifs: CloudVisionDatapoint = {};
  for (let i = 0; i < notif.length; i += 1) {
    const key = notif[i].key;
    const value = notif[i].value;
    const decodedKey = msgpack.decode(toByteArray(key), Codec, true);
    const decodedValue = msgpack.decode(toByteArray(value), Codec, true);
    decodedNotifs[key] = {
      key: decodedKey,
      value: decodedValue,
    };
  }
  return decodedNotifs;
}

function encodeNotifs(
  notif: Array<RawCloudVisionDatapoint> | CloudVisionDatapoint,
): Array<RawCloudVisionDatapoint> {
  const encodedNotifs: Array<RawCloudVisionDatapoint> = [];
  if (Array.isArray(notif)) {
    for (let i = 0; i < notif.length; i += 1) {
      const key = notif[i].key;
      const value = notif[i].value;
      encodedNotifs.push({
        key: fromByteArray(msgpack.encode(key, Codec)),
        value: fromByteArray(msgpack.encode(value, Codec)),
      });
    }
  } else {
    const notifKeys = Object.keys(notif);
    for (let i = 0; i < notifKeys.length; i += 1) {
      const key = notifKeys[i];
      const value = notif[key].value;
      encodedNotifs.push({
        key,
        value: fromByteArray(msgpack.encode(value, Codec)),
      });
    }
  }
  return encodedNotifs;
}

function encodeDeletes(deletes: Array<mixed> | CloudVisionDeletes): Array<string> {
  const decodedDeletes = [];
  if (Array.isArray(deletes)) {
    for (let i = 0; i < deletes.length; i += 1) {
      const key = deletes[i];
      decodedDeletes.push(fromByteArray(msgpack.encode(key, Codec)));
    }
  } else {
    const deleteKeys = Object.keys(deletes);
    for (let i = 0; i < deleteKeys.length; i += 1) {
      const key = deleteKeys[i];
      decodedDeletes.push(fromByteArray(msgpack.encode(deletes[key].key, Codec)));
    }
  }

  return decodedDeletes;
}

function decodeDeletes(deletes: Array<string>): CloudVisionDeletes {
  const decodedDeletes = {};
  for (let i = 0; i < deletes.length; i += 1) {
    const key = deletes[i];
    decodedDeletes[key] = {
      key: msgpack.decode(toByteArray(key), Codec, true),
    };
  }

  return decodedDeletes;
}

/**
 * The API server returns timestamps in nanoseconds.
 *
 * This converts timestamps in all notifications to milliseconds for use with
 * JS Date().
 *
 * **NOTE** this assumes that timestamps in notifications are in
 * microseconds, it does not check to ensure they are!
 */
function convertNotif(notif: RawCloudVisionNotification): CloudVisionNotification {
  const convertedNotif = {};
  convertedNotif.path_elements = decodePathElements(notif.path_elements || []);
  // Pad nano seconds
  let nanos = '';
  if (notif.timestamp.nanos) {
    nanos += notif.timestamp.nanos;
  }
  nanos = nanos.padStart(9, '0');
  convertedNotif.timestamp = parseInt(('' + notif.timestamp.seconds + nanos).slice(0, 13), 10);

  if (notif.updates) {
    convertedNotif.updates = decodeNotifs(notif.updates);
  }
  if (notif.deletes) {
    convertedNotif.deletes = decodeDeletes(notif.deletes);
  }
  if (notif.delete_all) {
    convertedNotif.deletes = {};
  }
  return convertedNotif;
}

function decodeAndBatchNotif(
  batch: CloudVisionBatchedNotifications,
  notif: RawCloudVisionNotification,
) {
  const convertedNotif: CloudVisionNotification = convertNotif(notif);
  if (batch.notifications[JSON.stringify(convertedNotif.path_elements)]) {
    batch.notifications[JSON.stringify(convertedNotif.path_elements)].push(convertedNotif);
  } else {
    batch.notifications[JSON.stringify(convertedNotif.path_elements)] = [convertedNotif];
  }
}

export function decodeNotifications(
  result: RawCloudVisionNotifs,
  batchResults: boolean,
): CloudVisionBatchedNotifications | CloudVisionNotifs {
  if (batchResults) {
    const batch: CloudVisionBatchedNotifications = {
      dataset: result.dataset,
      notifications: {},
    };

    for (let i = 0; i < result.notifications.length; i += 1) {
      const n: RawCloudVisionNotification = result.notifications[i];
      decodeAndBatchNotif(batch, n);
    }
    return batch;
  }

  const notif: CloudVisionNotifs = {
    dataset: result.dataset,
    notifications: [],
  };
  for (let i = 0; i < result.notifications.length; i += 1) {
    const n: RawCloudVisionNotification = result.notifications[i];
    const convertedNotif: CloudVisionNotification = convertNotif(n);
    notif.notifications.push(convertedNotif);
  }
  return notif;
}

function encodeNotification(notif: CloudVisionNotificationPublish): RawCloudVisionNotification {
  const encodedNotif: RawCloudVisionNotification = {
    timestamp: notif.timestamp,
  };

  if (notif.path_elements.length) {
    encodedNotif.path_elements = encodePathElements(notif.path_elements);
  }

  if (notif.updates) {
    // $FlowFixMe
    encodedNotif.updates = encodeNotifs(notif.updates);
  }

  if (notif.deletes) {
    if (!Object.keys(notif.deletes).length) {
      // $FlowFixMe
      encodedNotif.delete_all = true;
    } else {
      // $FlowFixMe
      encodedNotif.deletes = encodeDeletes(notif.deletes);
    }
  }

  return encodedNotif;
}

export function encodeNotifications(
  result: RawCloudVisionNotifs | CloudVisionBatchedNotifications,
) {
  const encodedData = [];
  const encodedNotif: RawCloudVisionNotifs = {
    dataset: result.dataset,
    notifications: encodedData,
  };

  if (!Array.isArray(result.notifications)) {
    // This is not in the raw format, so we need to convert it
    const notifKeys = Object.keys(result.notifications);
    for (let i = 0; i < notifKeys.length; i += 1) {
      const pathKey = notifKeys[i];
      for (let j = 0; j < result.notifications[pathKey].length; j += 1) {
        // $FlowFixMe
        encodedData.push(encodeNotification(result.notifications[pathKey][j]));
      }
    }
  } else {
    for (let i = 0; i < result.notifications.length; i += 1) {
      // $FlowFixMe
      encodedData.push(encodeNotification(result.notifications[i]));
    }
  }

  return encodedNotif;
}

class Parser {
  static parse(data: string, batch: boolean): CloudVisionMessage {
    const message: RawCloudVisionMessage = JSON.parse(data);
    if (message.result && !message.result.datasets && message.result.notifications) {
      // Timeseries notification that needs to be decoded with NEAT
      const decodedResult = decodeNotifications(message.result, batch);
      return {
        error: message.error,
        result: decodedResult,
        status: message.status,
        token: message.token,
      };
    }
    return {
      error: message.error,
      result: message.result,
      status: message.status,
      token: message.token,
    };
  }

  static stringify(message: CloudVisionQueryMessage): string {
    const params = message.params;
    if (params.query && Array.isArray(params.query)) {
      params.query = encodePathElementsAndKeysInQuery(params.query);
    }

    if (params.sync !== undefined && params.batch) {
      // $FlowFixMe
      params.batch = encodeNotifications(params.batch);
    }

    return JSON.stringify({
      token: message.token,
      command: message.command,
      params,
    });
  }
}

export default Parser;
