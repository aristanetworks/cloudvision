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

import { NotifCallback, PublishCallback, SubscriptionIdentifier } from '../types';
import {
  CloudVisionBatchedResult,
  CloudVisionResult,
  CloudVisionServiceResult,
  CloudVisionStatus,
} from '../types/notifications';
import {
  AppParams,
  CloudVisionParams,
  DatasetCommand,
  DatasetTypes,
  Query,
  QueryParams,
  SearchOptions,
  SearchParams,
  WsCommand,
} from '../types/params';
import { Options, PublishRequest, ServiceRequest } from '../types/query';

import {
  ACTIVE_CODE,
  APP_DATASET_TYPE,
  CLOSE,
  DEVICES_DATASET_ID,
  DEVICE_DATASET_TYPE,
  GET,
  GET_DATASETS,
  ID,
  PAUSE,
  PUBLISH,
  SEARCH,
  SEARCH_SUBSCRIBE,
  SUBSCRIBE,
  SERVICE_REQUEST,
} from './constants';
import {
  makeNotifCallback,
  makePublishCallback,
  makeToken,
  sanitizeOptions,
  sanitizeSearchOptions,
  validateOptions,
  validateQuery,
} from './utils';
import WRPC from './wrpc';

/**
 * The Connector uses WebSocket to enable transmission of data over an
 * open connection with the CloudVision API server.
 * It supports subscriptions, which allows clients to receive streaming
 * updates as data changes in real-time.
 */
class Connector extends WRPC {
  public static CLOSE: string;

  public static DEVICES_DATASET_ID: DatasetCommand;

  public static GET_DATASETS: WsCommand;

  public static GET: WsCommand;

  public static ID: string;

  public static PAUSE: WsCommand;

  public static PUBLISH: WsCommand;

  public static SEARCH_SUBSCRIBE: WsCommand;

  public static SEARCH: WsCommand;

  public static SUBSCRIBE: WsCommand;

  /**
   * Close multiple subscriptions in one `close` call. The subscription
   * identifier return in the `subscribe` call along with the close function
   * can be passed in here to close the subscription together with others.
   *
   * @example
   * ```typescript
   *
   * const query = [{
   *   dataset: {
   *     type: 'app',
   *     name: 'analytics'
   *   },
   *   paths: [{
   *     path_elements: ['events', 'activeEvents'],
   *   }],
   * }];
   * const handleResponse = (err, res) => {...};
   *
   * // Send the request
   * const subscriptionCloseFn = connector.subscribe(query, handleResponse);
   *
   * // Close the subscription via `closeSubscriptions`
   * const closeSubscriptions([subscriptionCloseFn.identifier]);
   * ```
   */
  public closeSubscriptions(
    subscriptions: SubscriptionIdentifier[],
    callback: NotifCallback,
  ): string | null {
    return this.closeStreams(subscriptions, makeNotifCallback(callback));
  }

  /**
   * Returns all notifications that match the given [[Query]] and [[Options]], in
   * addition to subscribing to updates. This will return notifications as
   * new updates to the data requested come in.
   *
   * A `getAndSubscribe` is done in such a way that no notifications are lost.
   * Before doing a `get`, a `subscribe` is initiated and we wait for an active
   * status message to be returned before initiating a `get`. This means no notifications
   * are missed, but there is a chance of duplicate notifications.
   *
   * @example
   * ```typescript
   *
   * const query = [{
   *   dataset: {
   *     type: 'app',
   *     name: 'analytics'
   *   },
   *   paths: [{
   *     path_elements: ['events', 'activeEvents'],
   *   }],
   * }];
   * const options = {
   *   start: 1504113817725,
   *   end: 1504113917725,
   * };
   * const handleResponse = (err, res) => {...};
   *
   * // open the stream
   * const closeSubscription = connector.getAndSubscribe(
   *   query, handleResponse, options);
   *
   * closeSubscription(); // close the stream when finished
   * ```
   */
  public getAndSubscribe(
    query: Query,
    callback: NotifCallback,
    options: Options,
  ): {
    subscribe: SubscriptionIdentifier | null;
    get: string;
  } | null {
    if (!validateQuery(query, callback)) {
      return null;
    }

    if (!validateOptions(options, callback)) {
      return null;
    }

    const sanitizedOptions = sanitizeOptions(options);

    const params: QueryParams = {
      query,
      start: sanitizedOptions.start,
      end: sanitizedOptions.end,
      versions: sanitizedOptions.versions,
    };
    const getToken = makeToken(GET, params);

    const subscribeAckCallback = (
      err: string | null,
      result?: CloudVisionBatchedResult | CloudVisionResult | CloudVisionServiceResult,
      status?: CloudVisionStatus,
      token?: string,
    ): void => {
      const subscribeNotifCallback = makeNotifCallback(callback);
      if (status && status.code === ACTIVE_CODE) {
        this.getWithOptions(query, callback, sanitizedOptions);
      } else {
        subscribeNotifCallback(err, result, status, token);
      }
    };

    return {
      subscribe: this.stream(SUBSCRIBE, { query }, subscribeAckCallback),
      get: getToken,
    };
  }

  /**
   * Returns a list of apps (datasets with type == 'app').
   */
  public getApps(callback: NotifCallback): string | null {
    const appType: typeof APP_DATASET_TYPE[] = [APP_DATASET_TYPE];
    const params: AppParams = { types: appType };
    return this.get(GET_DATASETS, params, makeNotifCallback(callback));
  }

  /**
   * Returns a list of datasets. This will return data sets of type 'device',
   * as well as type 'app'.
   */
  public getDatasets(callback: NotifCallback): string | null {
    const allDatasetTypes: DatasetTypes[] = [APP_DATASET_TYPE, DEVICE_DATASET_TYPE];
    const params: AppParams = { types: allDatasetTypes };
    return this.get(GET_DATASETS, params, makeNotifCallback(callback));
  }

  /**
   * Returns a list of devices (datasets with type == 'device').
   */
  public getDevices(callback: NotifCallback): string | null {
    const deviceType: typeof DEVICE_DATASET_TYPE[] = [DEVICE_DATASET_TYPE];
    return this.get(GET_DATASETS, { types: deviceType }, makeNotifCallback(callback));
  }

  /**
   * Generates the unique token that the request can be referenced by.
   */
  public getCommandToken(command: WsCommand, params: CloudVisionParams): string {
    return makeToken(command, params);
  }

  /**
   * Returns all notifications that match the given query and options.
   *
   * @example
   * ```typescript
   *
   * const query = [{
   *   dataset: {
   *     type: 'app',
   *     name: 'analytics'
   *   },
   *   paths: [{
   *     path_elements: ['events', 'activeEvents'],
   *   }],
   * }];
   * const options = {
   *   start: 1504113817725,
   *   end: 1504113917725,
   * };
   * const handleResponse = (err, res) => {...};
   *
   * // Send the request
   * connector.getWithOptions(query, handleResponse, options);
   * ```
   */
  public getWithOptions(
    query: Query | DatasetCommand,
    callback: NotifCallback,
    options: Options,
  ): string | null {
    if (query === DEVICES_DATASET_ID) {
      this.getDatasets(callback);
      return null;
    }

    if (!validateQuery(query, callback)) {
      return null;
    }

    if (!validateOptions(options, callback)) {
      return null;
    }

    const { start, end, versions } = sanitizeOptions(options);

    const params: QueryParams = {
      query,
      start,
      end,
      versions,
    };

    return this.get(GET, params, makeNotifCallback(callback, options));
  }

  public runService(request: ServiceRequest, callback: NotifCallback): void {
    this.requestService(request, makeNotifCallback(callback));
  }

  public runStreamingService(
    request: ServiceRequest,
    callback: NotifCallback,
  ): SubscriptionIdentifier | null {
    if (!request) {
      callback('`request` param cannot be empty');
      return null;
    }
    return this.stream(SERVICE_REQUEST, request, makeNotifCallback(callback));
  }

  public searchWithOptions(
    query: Query,
    callback: NotifCallback,
    options: Options & SearchOptions,
  ): string | null {
    if (!validateQuery(query, callback, true)) {
      return null;
    }

    if (!validateOptions(options, callback)) {
      return null;
    }

    const { start, end } = sanitizeOptions(options);

    const sanitizedSearchOptions = sanitizeSearchOptions(options);

    const params: SearchParams = {
      query,
      start,
      end,
      search: sanitizedSearchOptions.search,
      searchType: sanitizedSearchOptions.searchType,
    };

    return this.search(params, makeNotifCallback(callback, options));
  }

  public searchSubscribe(
    query: Query,
    callback: NotifCallback,
    options: SearchOptions = { search: '' },
  ): SubscriptionIdentifier | null {
    if (!validateQuery(query, callback, true)) {
      return null;
    }

    const sanitizedSearchOptions = sanitizeSearchOptions(options);

    return this.stream(
      SEARCH_SUBSCRIBE,
      {
        query,
        search: sanitizedSearchOptions.search,
        searchType: sanitizedSearchOptions.searchType,
      },
      makeNotifCallback(callback),
    );
  }

  /**
   * Creates a subscription to the given query, which will return
   * notifications as they happen. Note that this will not return any
   * historical data. The first update that is sent will be when the state
   * of the data in the query changes.
   *
   * @example
   * ```typescript
   *
   * const query = [{
   *   dataset: {
   *     type: 'app',
   *     name: 'analytics'
   *   },
   *   paths: [{
   *     path_elements: ['events', 'activeEvents'],
   *   }],
   * }];
   * const handleResponse = (err, res) => {...};
   *
   * // Send the request
   * const subscriptionCloseFn = connector.subscribe(query, handleResponse);
   * ```
   */
  public subscribe(query: Query, callback: NotifCallback): SubscriptionIdentifier | null {
    if (!validateQuery(query, callback)) {
      return null;
    }

    return this.stream(SUBSCRIBE, { query }, makeNotifCallback(callback));
  }

  /**
   * Write data to the CloudVision API server, where the update is a
   * series of notifications of a certain dataset.
   *
   * The writeSync operation is synchronous.
   */
  public writeSync(publishRequest: PublishRequest, callback: PublishCallback): void {
    this.publish(
      {
        sync: true,
        batch: {
          dataset: publishRequest.dataset,
          notifications: publishRequest.notifications,
        },
      },
      makePublishCallback(callback),
    );
  }
}

Connector.CLOSE = CLOSE;
Connector.DEVICES_DATASET_ID = DEVICES_DATASET_ID;
Connector.GET = GET;
Connector.GET_DATASETS = GET_DATASETS;
Connector.ID = ID;
Connector.PAUSE = PAUSE;
Connector.PUBLISH = PUBLISH;
Connector.SEARCH = SEARCH;
Connector.SEARCH_SUBSCRIBE = SEARCH_SUBSCRIBE;
Connector.SUBSCRIBE = SUBSCRIBE;

export default Connector;

export { ACTIVE_CODE, CONNECTED, DISCONNECTED, EOF_CODE } from './constants';

export { default as Parser } from './parser';

export { hashObject, fromBinaryKey, toBinaryKey, sanitizeOptions } from './utils';

export {
  isJsbi,
  isNeatType,
  NeatTypes,
  NeatTypeSerializer,
  Bool,
  Float32,
  Float64,
  Int,
  Nil,
  Pointer,
  Str,
  createBaseType,
} from 'a-msgpack';
