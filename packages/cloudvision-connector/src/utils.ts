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

import { encode, decode, Codec } from 'a-msgpack';
import { fromByteArray, toByteArray } from 'base64-js';

import {
  CloseParams,
  CloudVisionBatchedNotifications,
  CloudVisionBatchedResult,
  CloudVisionDatasets,
  CloudVisionNotifs,
  CloudVisionResult,
  CloudVisionServiceResult,
  CloudVisionStatus,
  NotifCallback,
  Options,
  PublishCallback,
  Query,
  RequestContext,
  SearchOptions,
  SearchType,
  SubscriptionIdentifier,
} from '../types';

import { ALL_SEARCH_TYPES, EOF_CODE, ERROR, SEARCH_TYPE_ANY } from './constants';
import Emitter from './emitter';
import { log } from './logger';

interface ExplicitSearchOptions extends SearchOptions {
  searchType: SearchType;
}

export interface ExplicitOptions extends Options {
  end: number | undefined;
  start: number | undefined;

  versions?: number;
}

/**
 * Checks if an argument is valid (a number larger than 0).
 */
export function isValidArg(val?: number): val is number {
  return typeof val === 'number' && val > 0;
}

/**
 * Checks if a timestamp value is specified in microseconds.
 */
export function isMicroSeconds(val: number): boolean {
  return val / 1e15 > 1;
}

/**
 * Returns sanitized version of [[Options]].
 * It does a number of things:
 *  - If a timestamp is passed as a millisecond timestamp, it will
 *    be converted to microseconds.
 *  - If start, end and versions are invalid, the value for the
 *    option will be set as `undefined`
 * @param options a map of all **unsanitized** connector [[Options]]
 * @return a map of all [[Options]] with their **sanitized** values
 */
export function sanitizeOptions(options: Options): ExplicitOptions {
  const { start, end, versions } = options;
  let startInt: number | undefined;
  let endInt: number | undefined;
  let versionsInt: number | undefined;

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
export function invalidParamMsg(start: number, end: number, versions?: number): string {
  return `invalid params: start: ${start}, end: ${end}, versions: ${versions || 'undefined'}`;
}

/**
 * Validates all [[Options]]. If validation passes, `true` will be returned.
 * If there are errors the callback ([[NotifCallback]]) is trigged with an error message.
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
 * Validates the [[Query]]. If validation passes `true` will be returned.
 * If there are errors the callback is trigged with an error message.
 */
export function validateQuery(query: Query, callback: NotifCallback, allowEmpty = false): boolean {
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
 * Creates a notification callback that properly formats the result for the
 * passed callback.
 */
export function makeNotifCallback(callback: NotifCallback, options: Options = {}): NotifCallback {
  const notifCallback = (
    err: string | null,
    result?: CloudVisionResult | CloudVisionBatchedResult | CloudVisionServiceResult,
    status?: CloudVisionStatus,
    token?: string,
    requestContext?: RequestContext,
  ): void => {
    if (status && status.code === EOF_CODE) {
      callback(null, undefined, status, token, requestContext);
      return;
    }
    if (err) {
      callback(
        `Error: ${err}\nOptions: ${JSON.stringify(options)}`,
        undefined,
        status,
        token,
        requestContext,
      );
      // Send an extra EOF response to mark notification as complete.
      callback(null, undefined, { code: EOF_CODE }, token, requestContext);
      return;
    }

    const datasets = result as CloudVisionDatasets;
    if (datasets?.datasets) {
      callback(null, datasets, status, token, requestContext);
      return;
    }

    const notifs = result as CloudVisionNotifs | CloudVisionBatchedNotifications;
    if (notifs?.dataset) {
      callback(null, notifs, status, token, requestContext);
      return;
    }

    // if none of the cases above apply, then it's a service request
    if (notifs) {
      callback(null, notifs, status, token, requestContext);
    }
  };

  return notifCallback;
}

/**
 * Creates the proper params for a [[Connector.close]] call. This will make sure that all
 * callbacks attached to the token are unbound before adding the token to the
 * close params.
 */
export function createCloseParams(
  streams: SubscriptionIdentifier[] | SubscriptionIdentifier,
  eventsMap: Emitter,
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
 * passed callback. When the status code is [[EOF_CODE]], the callback will be
 * called with its first argument being `true`, indicating that the publish has
 * succeeded.
 * Otherwise the callback will be called with its first argument being `false`,
 * indicating that the publish has failed, and the second will contain the
 * error message.
 */
export function makePublishCallback(callback: PublishCallback): NotifCallback {
  const publishCallback = (
    err: string | null,
    _result?:
      | CloudVisionBatchedNotifications
      | CloudVisionDatasets
      | CloudVisionNotifs
      | CloudVisionServiceResult
      | undefined,
    status?: CloudVisionStatus,
  ): void => {
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
  response: CloudVisionResult | CloudVisionBatchedResult | CloudVisionServiceResult,
  status: CloudVisionStatus | {},
  token: string,
  batch: boolean,
): void {
  if (status && Object.keys(status).length) {
    // This is a status message which does not need to be validated
    return;
  }

  const notifResponse = response as CloudVisionNotifs;
  /* eslint-disable no-console */
  if (notifResponse.dataset && !notifResponse.dataset.name) {
    log(ERROR, "No key 'name' found in dataset", undefined, token);
    return;
  }

  if (notifResponse.dataset && !notifResponse.dataset.type) {
    log(ERROR, "No key 'type' found in dataset", undefined, token);
    return;
  }

  if (notifResponse.dataset && !notifResponse.notifications) {
    log(ERROR, "No key 'notifications' found in response", undefined, token);
    return;
  }

  if (!batch && notifResponse.dataset && !Array.isArray(notifResponse.notifications)) {
    log(ERROR, "Key 'notifications' is not an array", undefined, token);
  }
  /* eslint-enable no-console */
}

/**
 * Returns sanitized version of [[SearchOptions]].
 *
 * If no search type is given, it will default to [[SEARCH_TYPE_ANY]].
 *
 * @param searchOptions a map of all **unsanitized** connector [[SearchOptions]]
 * @return a map of all [[SearchOptions]] with their **sanitized** values
 */
export function sanitizeSearchOptions(searchOptions: SearchOptions): ExplicitSearchOptions {
  const actualSearchType = searchOptions.searchType;
  let explicitSearchType: SearchType = SEARCH_TYPE_ANY;
  if (actualSearchType && ALL_SEARCH_TYPES.has(actualSearchType)) {
    explicitSearchType = actualSearchType;
  }

  return {
    search: searchOptions.search || '',
    searchType: explicitSearchType,
  };
}

/**
 * Returns the NEAT encoded version of the parameter `key`.
 *
 * @param key any value to encode.
 */
export function toBinaryKey(key: unknown): string {
  return fromByteArray(encode(key, { extensionCodec: Codec }));
}

/**
 * Returns the decoded value of a given base64, NEAT encoded string
 *
 * @param keyString base64, NEAT encoded value.
 */
export function fromBinaryKey(keyString: string, useJSBI = true): unknown {
  return decode(toByteArray(keyString), { extensionCodec: Codec, useJSBI });
}
