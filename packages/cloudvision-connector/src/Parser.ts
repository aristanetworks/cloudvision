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

import { encode, decode, Codec, PathElements } from 'a-msgpack';
import { fromByteArray, toByteArray } from 'base64-js';

import {
  BatchPublishRequest,
  CloudVisionBatchedNotifications,
  CloudVisionDatapoint,
  CloudVisionDeletes,
  CloudVisionMessage,
  CloudVisionNotifs,
  CloudVisionParams,
  CloudVisionPublishRequest,
  CloudVisionQueryMessage,
  CloudVisionRawNotifs,
  CloudVisionUpdates,
  ConvertedNotification,
  NewConvertedNotification,
  PathObject,
  PublishRequest,
  Query,
  QueryObject,
  QueryParams,
  RawNotification,
  ServiceRequest,
} from '../types';

const msgpack = {
  encode: (inputs: unknown): Uint8Array => encode(inputs, { extensionCodec: Codec }),
  decode: (data: Uint8Array): unknown => decode(data, { extensionCodec: Codec, useJSBI: true }),
};

/**
 * Individually NEAT encodes path elements
 * @param pathElements an array of unencoded path elements
 * @returns an array of encoded path elements
 */
export function encodePathElements(pathElements: PathElements): string[] {
  const encodedPathElements = [];
  for (let i = 0; i < pathElements.length; i += 1) {
    encodedPathElements.push(fromByteArray(msgpack.encode(pathElements[i])));
  }

  return encodedPathElements;
}

/**
 * NEAT encodes the path elements and keys in a [[Query]].
 *
 * @returns the [[Query]] with encoded path elements and keys.
 */
export function encodePathElementsAndKeysInQuery(query: Query): Query {
  const encodedQuery = [];
  for (let i = 0; i < query.length; i += 1) {
    const encodedQueryItem: QueryObject = {
      dataset: query[i].dataset,
      paths: [],
    };
    const queryItem = query[i];
    for (let j = 0; j < queryItem.paths.length; j += 1) {
      const path = queryItem.paths[j];
      const encodedPath: PathObject = {
        path_elements: [],
      };
      const encodedKeys = [];
      if (path.keys && Array.isArray(path.keys)) {
        for (let k = 0; k < path.keys.length; k += 1) {
          encodedKeys.push(fromByteArray(msgpack.encode(path.keys[k])));
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

/**
 * Decodes NEAT encoded path elements.
 *
 * @param pathElements an array of encoded path elements
 * @returns an array of path elements
 */
export function decodePathElements(pathElements: string[]): PathElements {
  const decodedPathElements = [];
  for (let i = 0; i < pathElements.length; i += 1) {
    decodedPathElements.push(msgpack.decode(toByteArray(pathElements[i])));
  }

  return decodedPathElements as PathElements;
}

/**
 * Decodes a single NEAT encoded update notification.
 *
 * @param notif an array of object with the keys `key` and `value`. The values are NEAT encoded
 * @returns an object keyed by the binary representation of the `key` value. Each value
 * is an object with the keys `key` and `value`, each of which are decoded.
 */
function decodeNotifs(
  notif: CloudVisionDatapoint<string, string>[],
): CloudVisionUpdates<unknown, unknown> {
  const decodedNotifs: CloudVisionUpdates<unknown, unknown> = {};
  for (let i = 0; i < notif.length; i += 1) {
    const key = notif[i].key;
    const value = notif[i].value;
    const decodedKey = msgpack.decode(toByteArray(key));
    const decodedValue = msgpack.decode(toByteArray(value));
    decodedNotifs[key] = {
      key: decodedKey,
      value: decodedValue,
    };
  }
  return decodedNotifs;
}

/**
 * Encodes a single update notification in NEAT.
 *
 * @param notif an array of objects with the keys `key` and `value`. The values are unencoded.
 * @returns an array of objects with the keys `key` and `value`. The value of these keys
 * is the NEAT encoded value of the raw data.
 */
function encodeNotifs(
  notif: CloudVisionDatapoint<unknown, unknown>[],
): CloudVisionDatapoint<string, string>[] {
  const encodedNotifs: CloudVisionDatapoint<string, string>[] = [];
  for (let i = 0; i < notif.length; i += 1) {
    const key = notif[i].key;
    const value = notif[i].value;
    encodedNotifs.push({
      key: fromByteArray(msgpack.encode(key)),
      value: fromByteArray(msgpack.encode(value)),
    });
  }

  return encodedNotifs;
}

/**
 * Encodes a single delete notification in NEAT.
 *
 * @param deletes an array of keys
 * @returns an array of NEAT encoded `key` values.
 */
function encodeDeletes(deletes: unknown[]): string[] {
  const decodedDeletes = [];
  for (let i = 0; i < deletes.length; i += 1) {
    const key = deletes[i];
    decodedDeletes.push(fromByteArray(msgpack.encode(key)));
  }

  return decodedDeletes;
}

/**
 * Decodes a single NEAT encoded delete notification.
 *
 * @param deletes an array of NEAT encoded `key` values.
 * @returns an array of decoded keys
 */
function decodeDeletes(deletes: string[]): CloudVisionDeletes<unknown> {
  const decodedDeletes: CloudVisionDeletes<unknown> = {};
  for (let i = 0; i < deletes.length; i += 1) {
    const key = deletes[i];
    decodedDeletes[key] = {
      key: msgpack.decode(toByteArray(key)),
    };
  }

  return decodedDeletes;
}

/**
 * The API server returns timestamps in the
 * [Protobuf Timestamp](https://developers.google.com/protocol-buffers/docs/reference/java/com/google/protobuf/Timestamp)
 * format.
 *
 * This converts timestamps in all notifications to milliseconds for use with
 * JS Date().
 *
 * **NOTE** this is deprecated and in upcoming versions the timestamp will be passed on in its full
 * resolution. This behavior will become an option that can be turned on.
 */
function convertNotif(notif: RawNotification): ConvertedNotification {
  const convertedNotif: ConvertedNotification = {
    path_elements: [],
    timestamp: 0,
  };
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

/**
 * Decodes notifications and batches them by their full path elements
 *
 * @param batch the batched notifications to which these raw notifications will be added.
 * @param notif the raw notifications as they come from the API server.
 */
function decodeAndBatchNotif(batch: CloudVisionBatchedNotifications, notif: RawNotification): void {
  const convertedNotif: ConvertedNotification = convertNotif(notif);
  if (batch.notifications[JSON.stringify(convertedNotif.path_elements)]) {
    batch.notifications[JSON.stringify(convertedNotif.path_elements)].push(convertedNotif);
  } else {
    batch.notifications[JSON.stringify(convertedNotif.path_elements)] = [convertedNotif];
  }
}

/**
 * Sort function to sort elements in an array by their GRPC timestamp.
 *
 * @param first The first element
 * @param second the second element to compare against
 */
export function sortTimestamp(first: RawNotification, second: RawNotification): number {
  // Compare seconds
  if (first.timestamp.seconds < second.timestamp.seconds) {
    return -1;
  }
  if (first.timestamp.seconds > second.timestamp.seconds) {
    return 1;
  }

  // Compare nanos
  if (first.timestamp.nanos && second.timestamp.nanos) {
    if (first.timestamp.nanos < second.timestamp.nanos) {
      return -1;
    }
    if (first.timestamp.nanos > second.timestamp.nanos) {
      return 1;
    }
  }

  if (!first.timestamp.nanos) {
    return -1;
  }
  if (!second.timestamp.nanos) {
    return 1;
  }

  return 0;
}

/**
 * Decodes the full result returned from the API server.
 *
 * @param result the raw notifications returned from the API server.
 * @param batchResults if `true`, notifications will be batched by their path elements.
 * otherwise the notifications will just be decoded and returned in the same format as
 * the server sends them.
 * @returns the decoded result returned from the server
 */
export function decodeNotifications(
  result: CloudVisionRawNotifs,
  batchResults: boolean,
): CloudVisionBatchedNotifications | CloudVisionNotifs {
  result.notifications.sort(sortTimestamp);

  if (batchResults) {
    const batch: CloudVisionBatchedNotifications = {
      dataset: result.dataset,
      metadata: result.metadata || {},
      notifications: {},
    };

    for (let i = 0; i < result.notifications.length; i += 1) {
      const n = result.notifications[i];
      decodeAndBatchNotif(batch, n);
    }
    return batch;
  }

  const notif: CloudVisionNotifs = {
    dataset: result.dataset,
    metadata: result.metadata || {},
    notifications: [],
  };
  for (let i = 0; i < result.notifications.length; i += 1) {
    const n = result.notifications[i];
    const convertedNotif: ConvertedNotification = convertNotif(n);
    notif.notifications.push(convertedNotif);
  }
  return notif;
}

/**
 * Encodes a single notification in NEAT.
 *
 * @param notif a single unencoded notification.
 * @returns the NEAT encoded notifications that can be sent to the server
 */
function encodeNotification(notif: NewConvertedNotification): RawNotification {
  const encodedNotif: RawNotification = {
    timestamp: notif.timestamp,
  };

  if (notif.path_elements && notif.path_elements.length) {
    encodedNotif.path_elements = encodePathElements(notif.path_elements);
  }

  if (notif.updates) {
    encodedNotif.updates = encodeNotifs(notif.updates);
  }

  if (notif.deletes) {
    if (!Object.keys(notif.deletes).length) {
      encodedNotif.delete_all = true;
    } else {
      encodedNotif.deletes = encodeDeletes(notif.deletes);
    }
  }

  return encodedNotif;
}

/**
 * Encodes a full request that can be sent to the server.
 *
 * @param request an unencoded request.
 * @returns a NEAT encoded request that can be sent to the server.
 */
export function encodeNotifications(
  request: PublishRequest | BatchPublishRequest,
): CloudVisionRawNotifs {
  const encodedData: RawNotification[] = [];
  const encodedNotif: CloudVisionRawNotifs = {
    dataset: request.dataset,
    notifications: encodedData,
  };

  if (!Array.isArray(request.notifications)) {
    // This is not in the raw format, so we need to convert it
    const notifKeys = Object.keys(request.notifications);
    for (let i = 0; i < notifKeys.length; i += 1) {
      const pathKey = notifKeys[i];
      for (let j = 0; j < request.notifications[pathKey].length; j += 1) {
        encodedData.push(encodeNotification(request.notifications[pathKey][j]));
      }
    }
  } else {
    for (let i = 0; i < request.notifications.length; i += 1) {
      encodedData.push(encodeNotification(request.notifications[i]));
    }
  }

  return encodedNotif;
}

/**
 * An implementation of a parser that enables communication with the server.
 * Implements stringify, so that requests can be sent to the server in the proper format.
 * Implements parse which decodes responses sent by the server.
 */
export default class Parser {
  public static parse(data: string, batch: boolean): CloudVisionMessage {
    const message = JSON.parse(data);
    const result = message.result;
    if (result && !result.datasets && result.notifications) {
      // Timeseries notification that needs to be decoded with NEAT
      const decodedResult = decodeNotifications(result, batch);
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

  public static stringify(message: CloudVisionQueryMessage): string {
    const params = { ...message.params };
    if (Parser.isQuery(params)) {
      params.query = encodePathElementsAndKeysInQuery(params.query);
    }

    if (Parser.isPublish(params)) {
      params.batch = encodeNotifications(params.batch);
    }

    return JSON.stringify({
      token: message.token,
      command: message.command,
      params,
    });
  }

  private static isQuery(
    params: CloudVisionParams | CloudVisionPublishRequest | ServiceRequest,
  ): params is QueryParams {
    const queryParams = params as QueryParams;
    return queryParams.query !== undefined && Array.isArray(queryParams.query);
  }

  private static isPublish(
    params: CloudVisionParams | CloudVisionPublishRequest | ServiceRequest,
  ): params is CloudVisionPublishRequest {
    const publishParams = params as CloudVisionPublishRequest;
    return publishParams.sync !== undefined && publishParams.batch !== undefined;
  }
}
