/* @flow */
/* eslint-disable no-use-before-define */

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

import MurmurHash3 from 'imurmurhash';

import { ALL_SEARCH_TYPES, EOF_CODE, SEARCH_TYPE_ANY } from './constants';
import type { EmitterType, EventCallback } from './emitter';

export type WsCommand =
  | 'get'
  | 'subscribe'
  | 'close'
  | 'getDatasets'
  | 'publish'
  | 'alpha/search'
  | 'alpha/searchSubscribe'
  | 'pause'
  | 'resume'
  | 'serviceRequest';

export type PathElements = $ReadOnlyArray<mixed>;

export type KeyObject = {
  [key: string]: {
    key: string | {} | Number,
    key_type?: string | {},
  },
};

export type PathObject = {
  path_elements: PathElements,
  keys?: Array<mixed> | KeyObject,
};

export type DatasetTypes = 'device' | 'app';

export type SearchType = 'MAC' | 'IP' | 'ANY';

export type SearchOptions = {
  search: string,
  searchType: SearchType,
};

export type DatasetObject = {
  type: DatasetTypes,
  name: string,
};

export type QueryObject = {
  dataset: DatasetObject,
  paths: Array<PathObject>,
};

/**
 * A query is a list of one or more objects. Each of these objects has two keys:
 * **dataset** (an object with keys **type** and **name**), and **paths**
 * (an array of path objects (with keys **type**, **path** and **keys**).
 *
 * Dataset object:
 *   type (string): can be 'device' or 'app'. The 'device' type is for physical
 *         devices (switches), whereas 'app' is for any analytics engines.
 *   name (string): the name of the dataset.
 *
 * Path object:
 *   path_elements (array): An array of path elements representing the path to
 *         the requested data.
 *   keys (object): an optional property so that only data with such keys are returned.
 *   Sample keys object: { 'any_custom_key': { key: 'speed'} }
 *
 * @example
 * [{
 *   dataset: {
 *     type: 'app',
 *     name: 'analytics'
 *   },
 *   paths: [{
 *     path_elements: ['events', 'activeEvents'],
 *   }],
 * }, {
 *   dataset: {
 *     type: 'device',
 *     name: 'JAS11070002'
 *   },
 *   paths: [{
 *     path_elements: ['Logs', 'var', 'log', 'messages'],
 *     keys: {
 *       logMessage: {
 *         key: 'text',
 *       },
 *     },
 *   }],
 * }]
 */
export type Query = Array<QueryObject>;

export type QueryParms = {|
  query?: Query,
  start?: number,
  end?: number,
  versions?: number,
  types?: Array<DatasetTypes>,
|};

export type SearchParms = {|
  end?: number,
  query: Query,
  search: string,
  searchType: SearchType,
  start?: number,
|};

export type CloudVisionDatapoint = {
  [updateKey: string]: {
    key: mixed,
    value: mixed,
  },
};

export type CloudVisionDeletes = {
  [updateKey: string]: {
    key: mixed,
  },
};

export type CloudVisionNotification = {
  path_elements: PathElements,
  path?: string,
  timestamp: number,
  updates?: CloudVisionDatapoint,
  deletes?: CloudVisionDeletes,
};

export type CloudVisionDatsets = {|
  datasets: Array<DatasetObject>,
|};

export type CloudVisionNotifs = {|
  dataset: DatasetObject,
  notifications: Array<CloudVisionNotification>,
|};

/**
 * This can either be the update returned as query result, or update to write
 * to the CloudVision API server.
 */
export type CloudVisionUpdate = CloudVisionNotifs | CloudVisionDatsets;

export type CloudVisionPublishParams = {|
  sync: boolean,
  batch: any,
|};

/**
 * Parameters passed to the `close` request.
 */
export type CloseParams =
  | {|
      [string]: boolean,
    |}
  | Object;

export type CloudVisionStatus = {
  code: number,
  message?: string,
};

export type PauseParams = {|
  pauseStreams: boolean,
|};

export type ResumeParams = {|
  token: string,
|};

export type ServiceRequest = {|
  service: string,
  method: string,
  body: {},
|};

export type CloudVisionParams =
  | QueryParms
  | CloseParams
  | SearchParms
  | CloudVisionPublishParams
  | PauseParams
  | ResumeParams
  | ServiceRequest;

export type CloudVisionMessage = {
  error?: string,
  result: CloudVisionBatchedResult | CloudVisionUpdate,
  status: CloudVisionStatus,
  token: string,
};

export type ConnectionCallback = (connEvent: string, wsEvent: Event) => void;

export type CachedFrame = {
  result?: CloudVisionBatchedResult | CloudVisionUpdate,
  status?: CloudVisionStatus,
};

/**
 * A callback in invoked when the server sends data.
 */
export type RawNotifCallback = (
  err: ?string,
  result: ?CloudVisionBatchedResult | ?CloudVisionUpdate,
  status: ?CloudVisionStatus,
  token: ?string,
) => void;

export type RawPublishCallback = (err: ?string, status: ?CloudVisionStatus) => void;

/**
 * Uniquely identifies a `stream` call. Tokens are created based of the command
 * and request params, so identical calls with have identical tokens. This
 * means we use the callback to identify the call, if there are multiple of
 * the same calls.
 */
export type SubscriptionIdentifier = {
  token: string,
  callback: EventCallback,
};

export type CloudVisionBatchedNotifications = {|
  dataset: DatasetObject,
  notifications: {
    [path: string]: Array<CloudVisionNotification>,
  },
|};

export type CloudVisionBatchedResult = CloudVisionBatchedNotifications | CloudVisionDatsets;

export type NotifCallback = (
  err: ?string,
  result: ?CloudVisionBatchedResult | ?CloudVisionUpdate,
  status: ?CloudVisionStatus,
) => void;

export type PublishCallback = (success: boolean, err: ?string) => void;

export type ServiceCallback = (err: ?string, result: mixed, status: {}) => void;

/**
 * The epoch timestamp in (milliseconds)
 */
export type EpochTimestamp = number;

/**
 * There are a number of options you can supply which limit the scope of
 * the query. Options are passed as an object, where the key is the
 * name of the option and the value is the value for that option.
 *
 * There are different combinations of options that are valid, each of them is
 * listed below.
 *
 * @example
 * // Range query (returns one or more data points)
 * {
 *   start: 1505760134000,
 *   end: 1505760184000,
 * }
 *
 * // Point in time query (returns exactly one data point)
 * {
 *   end: 1505760184000,
 * }
 *
 * // Limit query (returns `versions` + 1 number of data points)
 * {
 *   versions: 1,
 *   end: 1505760184000,
 * }
 */
export type Options = {
  start?: EpochTimestamp,
  end?: EpochTimestamp,
  versions?: number,
};

/**
 * Checks if an argument is valid (a number larger than 0).
 */
export function isValidArg(val: ?number): %checks {
  return typeof val === 'number' && val > 0;
}

/**
 * Checks if a timestamp value is specified in microseconds.
 */
export function isMicroSeconds(val: number): boolean {
  return val / 1e15 > 1;
}

/**
 * Returns sanitized version of options.
 * It does a number of things:
 *  - If a timestamp is passed as a millisecond timestamp, it will
 *    be converted to microseconds.
 *  - If start, end and versions are invalid, the value for the
 *    option will be set as `undefined`
 * @param options a map of all **unsanitized** connector options
 * @return a map of all options with their **sanitized** values
 */
export function sanitizeOptions(options: Options): Options {
  const { start, end, versions } = options;
  let startInt: number;
  let endInt: number;
  let versionsInt: number;

  if (isValidArg(start)) {
    startInt = Math.floor(start) * (isMicroSeconds(start) ? 1 : 1e6);
  }
  if (isValidArg(end)) {
    endInt = Math.floor(end) * (isMicroSeconds(end) ? 1 : 1e6);
  }
  if (isValidArg(versions)) {
    versionsInt = Math.floor(versions);
  }

  return {
    start: startInt,
    end: endInt,
    versions: versionsInt,
  };
}

/**
 * Formats a message specifying all invalid params
 */
export function invalidParamMsg(start: number, end: number, versions: ?number): string {
  return `invalid params: start: ${start}, end: ${end}, versions: ${versions || 'undefined'}`;
}

/**
 * Validates all options. If validation passes `true` will be returned.
 * If there are errors the callback is trigged with an error message.
 */
export function validateOptions(options: Options, callback: NotifCallback): boolean {
  const { start, end, versions } = options;
  if (start && end && start >= end) {
    callback(invalidParamMsg(start, end, versions));
    return false;
  }

  if (start && versions) {
    callback('Defining start and versions is invalid');
    return false;
  }

  return true;
}

/**
 * Validates the query. If validation passes `true` will be returned.
 * If there are errors the callback is trigged with an error message.
 */
export function validateQuery(query: any, callback: NotifCallback, allowEmpty: boolean = false) {
  if (!Array.isArray(query)) {
    callback('`query` param must be an array');
    return false;
  }

  if (!allowEmpty && (!query || !query.length)) {
    callback('`query` param cannot be empty');
    return false;
  }

  return true;
}

/**
 * Creates a unique hash given an object.
 */
export function hashObject(object: Object): string {
  const hash = new MurmurHash3();
  const objKeys = Object.keys(object);
  for (let i = 0; i < objKeys.length; i += 1) {
    const key = objKeys[i];
    const value = object[key];
    if (value && typeof value === 'object') {
      hash.hash(key).hash(hashObject(value));
    } else {
      hash.hash(key + '' + value);
    }
  }

  return hash.result().toString();
}

/**
 * Generates token based on the command and params of a request. This is
 * used to map requests to responses when dispatch response callbacks.
 */
export function makeToken(command: WsCommand, params: CloudVisionParams): string {
  return hashObject({
    command,
    params,
  });
}

/**
 * Creates a notification callback that properly formats the result for the
 * passed callback.
 */
export function makeNotifCallback(
  callback: NotifCallback,
  options: Options = {},
): RawNotifCallback {
  const notifCallback = (
    err: ?string,
    result: ?CloudVisionUpdate | ?CloudVisionBatchedResult,
    status: ?CloudVisionStatus,
  ) => {
    if (status && status.code === EOF_CODE) {
      callback(null, null, status);
      return;
    }
    if (err) {
      callback(`Error: ${err}\nOptions: ${JSON.stringify(options)}`, null, status);
      // Send an extra EOF response to mark notification as complete.
      callback(null, null, { code: EOF_CODE });
      return;
    }

    if (result && result.datasets) {
      callback(null, result, status);
      return;
    }

    if (result && result.dataset) {
      callback(null, result, status);
    }
  };

  return notifCallback;
}

/**
 * Creates the proper params for a `close` call. This will make sure that all
 * callbacks attached to the token are unbound before adding the token to the
 * close params.
 */
export function createCloseParams(
  streams: Array<SubscriptionIdentifier> | SubscriptionIdentifier,
  eventsMap: EmitterType,
): CloseParams | null {
  const closeParams: CloseParams = {};
  if (Array.isArray(streams)) {
    const streamsLen = streams.length;
    for (let i = 0; i < streamsLen; i += 1) {
      const { token, callback } = streams[i];
      const remainingCallbacks = eventsMap.unbind(token, callback);
      // Get number of registered callbacks for each stream, to determine which to close
      if (remainingCallbacks === 0) {
        closeParams[token] = true;
      }
    }
  } else {
    const { token, callback } = streams;
    const remainingCallbacks = eventsMap.unbind(token, callback);
    // Get number of registered callbacks for each stream, to determine which to close
    if (remainingCallbacks === 0) {
      closeParams[token] = true;
    }
  }

  return Object.keys(closeParams).length ? closeParams : null;
}

/**
 * Creates a publish callback that properly formats the result for the
 * passed callback. When the status code is `EOF_CODE`, the callback will be
 * called with its first argument being `true`, indicating that the publish has
 * succeeded.
 * Otherwise the callback will be called with its first argument being `false`,
 * indicating that the publish has failed, and the second will contain the
 * error message.
 */
export function makePublishCallback(callback: PublishCallback): RawPublishCallback {
  const publishCallback = (err: ?string, status: ?CloudVisionStatus) => {
    if (status && status.code === EOF_CODE) {
      callback(true);
      return;
    }
    if (err) {
      callback(false, `Error: ${err}\n`);
    }
  };

  return publishCallback;
}

/**
 * Validates a response from the server. This will log any errors to the console
 * but will not attempt to fix the response.
 */
export function validateResponse(
  response: CloudVisionUpdate | CloudVisionBatchedResult,
  status: CloudVisionStatus,
  token: string,
  batch: boolean,
): void {
  if (status && Object.keys(status).length) {
    // This is a status message which does not need to be validated
    return;
  }

  /* eslint-disable no-console */
  if (response.dataset && !response.dataset.name) {
    console.error(`No key 'name' found in dataset for token ${token}`);
    return;
  }

  if (response.dataset && !response.dataset.type) {
    console.error(`No key 'type' found in dataset for token ${token}`);
    return;
  }

  if (response.dataset && !response.notifications) {
    console.error(`No key 'notifications' found in response for token ${token}`);
    return;
  }

  if (!batch && response.dataset && !Array.isArray(response.notifications)) {
    console.error(`Key 'notifications' is not an array for token ${token}`);
  }
  /* eslint-enable no-console */
}

export function sanitizeSearchOptions(searchOptions: SearchOptions): SearchOptions {
  let actualSearchType = searchOptions.searchType;
  if (!ALL_SEARCH_TYPES.has(actualSearchType)) {
    actualSearchType = SEARCH_TYPE_ANY;
  }

  return {
    search: searchOptions.search,
    searchType: actualSearchType,
  };
}
