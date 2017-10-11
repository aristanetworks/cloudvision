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

import {
  ACTIVE_CODE,
  APP_DATASET_TYPE,
  CLOSE,
  DEVICE_DATASET_TYPE,
  DEVICES_DATASET_ID,
  GET_DATASETS,
  GET,
  PAUSE,
  PUBLISH,
  SEARCH_SUBSCRIBE,
  SEARCH,
  SUBSCRIBE,
} from './constants';
import {
  makeNotifCallback,
  makePublishCallback,
  sanitizeSearchOptions,
  sanitizeOptions,
  validateOptions,
  validateQuery,
} from './utils';
import type {
  CloudVisionNotification,
  DatasetObject,
  DatasetTypes,
  NotifCallback,
  Options,
  PublishCallback,
  Query,
  QueryParms,
  SearchOptions,
  SearchParms,
  SubscriptionIdentifier,
} from './utils';
import WRPC from './wrpc';
import type { SubscriptionCloseFunction } from './wrpc';

/**
 * The request type of a publish command.
 * @dataset is the root of the path.
 * @notifications is the data to write to. For the type
 * @CloudVisionNotification, please refer to its
 * definition in "Data Model" section.
 */
export type PublishRequest = {
  dataset: DatasetObject,
  notifications: Array<CloudVisionNotification>,
};

export type GetDatasetsCommand = typeof DEVICES_DATASET_ID;

/**
 * The Connector uses WebSockets to enable transmission of data over an
 * open connection with the CloudVision API server.
 * It supports subscriptions, which allows clients to receive streaming
 * updates as data changes in real-time.
 */
class Connector extends WRPC {
  static SUBSCRIBE: string;

  static GET: string;

  static GET_DATASETS: string;

  static DEVICES_DATASET_ID: string;

  static PAUSE: string;

  /**
   * Close multiple subscriptions in one `close` call. The subscription
   * identifier return in the `subscribe` call along with the close function
   * can be passed in here to close the subscription together with others.
   *
   * @example
   * const query = [{
   *   dataset: {
   *     type: 'app',
   *     name: 'analytics'
   *   },
   *   paths: [{
   *     type: 'EXACT',
   *     path: '/events/activeEvents',
   *   }],
   * }];
   * const handleResponse = (err, res) => {...};
   *
   * // Send the request
   * const subscriptionCloseFn = connector.subscribe(query, handleResponse);
   *
   * // Close the subscription via `closeSubscriptions`
   * const closeSubscriptions([subscriptionCloseFn.identifier]);
   */
  closeSubscriptions(subscriptions: Array<SubscriptionIdentifier>, callback: NotifCallback) {
    return this.closeStreams(CLOSE, subscriptions, makeNotifCallback(callback));
  }

  /**
   * Returns all notifications that match the given query and options, in
   * addition to subscribing to updates. This will return notifications as
   * new updates to the data requested come in.
   *
   * A `getAndSubscribe` is done in such a way that not notifications are lost.
   * Before doing a `get`, a `subscribe` is initiated and we wait for an active
   * status message to be returned before initiating a `get`.
   *
   * @example
   * const query = [{
   *   dataset: {
   *     type: 'app',
   *     name: 'analytics'
   *   },
   *   paths: [{
   *     type: 'EXACT',
   *     path: '/events/activeEvents',
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
   */
  getAndSubscribe(
    query: Query,
    callback: NotifCallback,
    options: Options = {},
  ): SubscriptionCloseFunction {
    const subscribeAckCallback = (err, res, status) => {
      const subscribeNotifCallback = makeNotifCallback(callback);
      if (status && status.code === ACTIVE_CODE) {
        this.getWithOptions(query, callback, options);
      } else {
        subscribeNotifCallback(err, res, status);
      }
    };
    const closeFn: SubscriptionCloseFunction = this.stream(
      SUBSCRIBE,
      { query },
      subscribeAckCallback,
    );
    return closeFn;
  }

  /**
   * Returns a list of apps (datasets with type == 'app').
   */
  getApps(callback: NotifCallback): void {
    const appType: Array<typeof APP_DATASET_TYPE> = [APP_DATASET_TYPE];
    this.get(
      GET_DATASETS,
      { types: appType },
      makeNotifCallback(callback),
    );
  }

  /**
   * Returns a list of data sets. This will return data sets of type 'device',
   * as well as type 'app'.
   */
  getDatasets(callback: NotifCallback): void {
    const allDatasetTypes: Array<DatasetTypes> = [APP_DATASET_TYPE, DEVICE_DATASET_TYPE];
    this.get(
      GET_DATASETS,
      { types: allDatasetTypes },
      makeNotifCallback(callback),
    );
  }

  /**
   * Returns a list of devices (datasets with type == 'device').
   */
  getDevices(callback: NotifCallback): void {
    const deviceType: Array<typeof DEVICE_DATASET_TYPE> = [DEVICE_DATASET_TYPE];
    this.get(
      GET_DATASETS,
      { types: deviceType },
      makeNotifCallback(callback),
    );
  }

  /**
   * Returns all notifications that match the given query and options.
   *
   * @example
   * const query = [{
   *   dataset: {
   *     type: 'app',
   *     name: 'analytics'
   *   },
   *   paths: [{
   *     type: 'EXACT',
   *     path: '/events/activeEvents',
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
   */
  getWithOptions(
    query: Query | GetDatasetsCommand,
    callback: NotifCallback,
    options: Options = {},
  ): void {
    if (query === DEVICES_DATASET_ID) {
      this.getDatasets(callback);
      return;
    }

    if (typeof query !== 'string') {
      if (!validateQuery(query, callback)) {
        return;
      }

      if (!validateOptions(options, callback)) {
        return;
      }

      const {
        start, end, versions,
      } = sanitizeOptions(options);

      const params: QueryParms = {
        query, start, end, versions,
      };

      this.get(
        GET,
        params,
        makeNotifCallback(callback, options),
      );
    } else {
      callback('invalid command for `getWithOptions`');
    }
  }

  searchWithOptions(
    searchOptions: SearchOptions,
    callback: NotifCallback,
    options: Options,
    query: Query = [],
  ): void {
    if (!validateQuery(query, callback, true)) {
      return;
    }

    if (!validateOptions(options, callback)) {
      return;
    }

    const {
      start, end,
    } = sanitizeOptions(options);

    const sanitizedSearchOptions = sanitizeSearchOptions(searchOptions);

    const params: SearchParms = {
      query,
      start,
      end,
      search: sanitizedSearchOptions.search,
      searchType: sanitizedSearchOptions.searchType,
    };

    this.search(SEARCH, params, makeNotifCallback(callback, options));
  }

  searchSubscribe(
    searchOptions: SearchOptions,
    query: Query,
    callback: NotifCallback,
  ): SubscriptionCloseFunction {
    const sanitizedSearchOptions = sanitizeSearchOptions(searchOptions);

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
   * Subscriptions can have `REGEXP` (not just `EXACT`, as is the case for
   * `gets`) as their path type, which allows subscribing to a path using any
   * syntax supported by regular expressions.
   *
   * @example
   * const query = [{
   *   dataset: {
   *     type: 'app',
   *     name: 'analytics'
   *   },
   *   paths: [{
   *     type: 'EXACT',
   *     path: '/events/activeEvents',
   *   }],
   * }];
   * const handleResponse = (err, res) => {...};
   *
   * // Send the request
   * const subscriptionCloseFn = connector.subscribe(query, handleResponse);
   */
  subscribe(query: Query, callback: NotifCallback): SubscriptionCloseFunction {
    return this.stream(SUBSCRIBE, { query }, makeNotifCallback(callback));
  }

  /**
   * Write data to the CloudVision API server, where the update is a
   * series of notifications of a certain data set.
   *
   * The writeSync operation is synchronous.
   */
  writeSync(
    publishRequest: PublishRequest,
    callback: PublishCallback,
  ) {
    this.publish(
      PUBLISH,
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

Connector.SUBSCRIBE = SUBSCRIBE;
Connector.GET = GET;
Connector.GET_DATASETS = GET_DATASETS;
Connector.DEVICES_DATASET_ID = DEVICES_DATASET_ID;
Connector.PAUSE = PAUSE;

export default Connector;

export {
  ACTIVE_CODE,
  EOF_CODE,
} from './constants';
