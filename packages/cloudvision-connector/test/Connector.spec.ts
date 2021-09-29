/**
 * @jest-environment jsdom
 */

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

import { PathElements } from 'a-msgpack';

import Connector from '../src/Connector';
import {
  ALL_DATASET_TYPES,
  APP_DATASET_TYPE,
  CONFIG_DATASET_TYPE,
  DEVICES_DATASET_ID,
  DEVICE_DATASET_TYPE,
  GET,
  GET_AND_SUBSCRIBE,
  GET_DATASETS,
  GET_REGIONS_AND_CLUSTERS,
  SEARCH,
  SEARCH_SUBSCRIBE,
  SEARCH_TYPE_ANY,
  SERVICE_REQUEST,
  SUBSCRIBE,
} from '../src/constants';
import { sanitizeOptions, sanitizeSearchOptions, toBinaryKey } from '../src/utils';
import {
  CloudVisionStatus,
  NotifCallback,
  Options,
  PublishRequest,
  Query,
  QueryParams,
  RequestContext,
  SearchOptions,
  SearchParams,
  ServiceRequest,
  SubscriptionIdentifier,
  WsCommand,
} from '../types';

const dataset = 'deviceFoo';
const rootPath: PathElements = [];
const rootQuery: Query = [
  {
    dataset: { type: DEVICE_DATASET_TYPE, name: dataset },
    paths: [{ path_elements: rootPath }],
  },
];
const singlePathQuery: Query = [
  {
    dataset: { type: DEVICE_DATASET_TYPE, name: dataset },
    paths: [{ path_elements: ['this', 'is', 'the', 'first', 'path'] }],
  },
];
const serviceQuery: ServiceRequest = {
  service: 'A',
  method: 'B',
  body: {
    param1: 'param1',
    param2: 'param2',
  },
};
const multiplePathQuery: Query = [
  {
    dataset: { type: DEVICE_DATASET_TYPE, name: dataset },
    paths: [
      { path_elements: ['this', 'is', 'the', 'first', 'path'] },
      { path_elements: ['and', 'this', 'is', 'the', 'second'] },
    ],
  },
];
const SEARCH_OPTIONS: SearchOptions = {
  search: '',
  searchType: SEARCH_TYPE_ANY,
};
const ERROR_MESSAGE = 'error';
const ERROR_STATUS: CloudVisionStatus = {
  code: 3,
  message: ERROR_MESSAGE,
};

jest.spyOn(console, 'groupCollapsed').mockImplementation();

function setupConnector(): Connector {
  const conn = new Connector();
  conn.run('ws://localhost:8080');
  conn.websocket.dispatchEvent(new MessageEvent('open', {}));

  return conn;
}

describe('closeSubscriptions', () => {
  const streamCallback = jest.fn();
  const streamToken = 'DodgerBlue';
  const streamCallback2 = jest.fn();
  const streamToken2 = 'VinScully';
  const subscriptions = [
    { token: streamToken, callback: streamCallback },
    { token: streamToken2, callback: streamCallback2 },
  ];

  test('should close multiple subscriptions in one call', () => {
    const conn = setupConnector();

    jest.spyOn(conn, 'closeStreams');
    const spyCallback = jest.fn();

    conn.closeSubscriptions(subscriptions, spyCallback);

    expect(conn.closeStreams).toHaveBeenCalledWith(subscriptions, expect.any(Function));
    expect(spyCallback).not.toHaveBeenCalled();
  });
});

describe('writeSync', () => {
  test('should call writeSync with proper params', () => {
    const publishRequest: PublishRequest = {
      dataset: { name: 'analytics', type: APP_DATASET_TYPE },
      notifications: [
        {
          timestamp: { seconds: 1 },
          path_elements: ['test'],
          updates: [{ key: 'someKey', value: 'somevalue' }],
        },
      ],
    };

    const conn = setupConnector();

    jest.spyOn(conn, 'writeSync');
    const spyCallback = jest.fn();

    conn.writeSync(publishRequest, spyCallback);
    expect(conn.writeSync).toHaveBeenCalledTimes(1);
    expect(conn.writeSync).toHaveBeenCalledWith(publishRequest, expect.any(Function));
    expect(spyCallback).not.toHaveBeenCalled();
  });
});

describe('runService', () => {
  test('should call runService with proper params', () => {
    const conn = setupConnector();

    jest.spyOn(conn, 'requestService');
    const spyCallback = jest.fn();

    conn.runService(serviceQuery, spyCallback);
    expect(conn.requestService).toHaveBeenCalledTimes(1);
    expect(conn.requestService).toHaveBeenCalledWith(serviceQuery, expect.any(Function));
    expect(spyCallback).not.toHaveBeenCalled();
  });
});

describe('runStreamingService', () => {
  test('should call runStreamingService with proper params and receive streamIdentifier', () => {
    const conn = setupConnector();

    jest.spyOn(conn, 'runStreamingService');
    const spyCallback = jest.fn();

    const streamIdentifier = conn.runStreamingService(serviceQuery, spyCallback);
    if (streamIdentifier !== null) {
      expect(streamIdentifier.token).toEqual(expect.any(String));
      expect(typeof streamIdentifier.callback).toBe('function');
    }
    expect(conn.runStreamingService).toHaveBeenCalledTimes(1);
    expect(conn.runStreamingService).toHaveBeenCalledWith(serviceQuery, expect.any(Function));
    expect(spyCallback).not.toHaveBeenCalled();
  });
});

describe('getDatasets', () => {
  let conn: Connector;
  let spyCallback: () => void;

  beforeEach(() => {
    conn = setupConnector();
    jest.spyOn(conn, 'get');
    spyCallback = jest.fn();
  });

  test('should get all datasets', () => {
    conn.getDatasets(spyCallback);

    expect(conn.get).toHaveBeenCalledWith(
      GET_DATASETS,
      { types: [APP_DATASET_TYPE, CONFIG_DATASET_TYPE, DEVICE_DATASET_TYPE] },
      expect.any(Function),
    );
  });

  test('should get all device type datasets', () => {
    conn.getDevices(spyCallback);

    expect(conn.get).toHaveBeenCalledWith(
      GET_DATASETS,
      { types: [DEVICE_DATASET_TYPE] },
      expect.any(Function),
    );
  });

  test('should get all app type datasets', () => {
    conn.getApps(spyCallback);

    expect(conn.get).toHaveBeenCalledWith(
      GET_DATASETS,
      { types: [APP_DATASET_TYPE] },
      expect.any(Function),
    );
  });

  test('should get all config type datasets', () => {
    conn.getConfigs(spyCallback);

    expect(conn.get).toHaveBeenCalledWith(
      GET_DATASETS,
      { types: [CONFIG_DATASET_TYPE] },
      expect.any(Function),
    );
  });

  test('should get all datasets using `getWithOptions` ', () => {
    conn.getWithOptions(DEVICES_DATASET_ID, spyCallback, {});

    expect(conn.get).toHaveBeenCalledWith(
      GET_DATASETS,
      { types: ALL_DATASET_TYPES },
      expect.any(Function),
    );
  });
});

describe('getRegionsAndClusters', () => {
  let conn: Connector;
  let spyCallback: () => void;

  beforeEach(() => {
    conn = setupConnector();
    jest.spyOn(conn, 'get');
    spyCallback = jest.fn();
  });

  test('should get all datasets', () => {
    conn.getRegionsAndClusters(spyCallback);

    expect(conn.get).toHaveBeenCalledWith(GET_REGIONS_AND_CLUSTERS, {}, expect.any(Function));
  });
});

describe.each([
  ['getWithOptions', GET, 'get'],
  ['searchWithOptions', SEARCH, 'search', true],
])('Get Queries', (fn, command, wrpcFn, isSearch?) => {
  const options = {} as Options & SearchOptions;
  const callback = jest.fn();
  let conn: Connector;
  let commandFnSpy: jest.SpyInstance;
  let connFn: (q: Query, cb: NotifCallback, o: Options) => string | null;
  const RESULT = { dataset: 'Dodgers' };

  function createRequestContext(
    c: string,
    token: string,
    query: Query,
    o: Options & SearchOptions,
  ): RequestContext {
    const { start, end, versions } = sanitizeOptions(o);
    let params: SearchParams | QueryParams = { query, start, end, versions };
    if (isSearch) {
      const sanitizedSearchOptions = sanitizeSearchOptions(o);
      params = {
        query,
        start,
        end,
        search: sanitizedSearchOptions.search,
        searchType: sanitizedSearchOptions.searchType,
      };
    }
    return {
      command: c as WsCommand,
      token,
      encodedParams: toBinaryKey(params),
    };
  }

  beforeEach(() => {
    conn = new Connector();
    // @ts-expect-error Easier than typing everything
    connFn = conn[fn];
    // @ts-expect-error Easier than typing everything
    commandFnSpy = jest.spyOn(conn, wrpcFn);
    conn.run('ws://localhost:8080');
    conn.websocket.dispatchEvent(new MessageEvent('open', {}));
  });

  afterEach(() => {
    callback.mockClear();
    commandFnSpy.mockClear();
  });

  test(`'${fn}' should handle empty query`, () => {
    const query: Query = [];

    const token = connFn.call(conn, query, callback, options);

    if (isSearch) {
      // empty is valid for search
      expect(commandFnSpy).toHaveBeenCalledTimes(1);
      expect(callback).not.toHaveBeenCalled();
      expect(token).not.toBeNull();
    } else {
      expect(commandFnSpy).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledTimes(1);
      expect(token).toBeNull();
    }
  });

  test(`'${fn}' should handle invalid query`, () => {
    const query = undefined;

    // @ts-expect-error Easier than typing everything
    const token = connFn.call(conn, query, callback, options);

    expect(commandFnSpy).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(token).toBeNull();
  });

  test(`'${fn}' should handle invalid options`, () => {
    const token = connFn.call(conn, singlePathQuery, callback, { start: 4, end: 1 });

    expect(commandFnSpy).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(token).toBeNull();
  });

  test(`'${fn}' should handle multiple paths`, () => {
    const token = connFn.call(conn, multiplePathQuery, callback, options);

    expect(callback).not.toHaveBeenCalled();
    if (isSearch) {
      expect(commandFnSpy).toHaveBeenCalledWith(
        { query: multiplePathQuery, ...SEARCH_OPTIONS },
        expect.any(Function),
      );
    } else {
      expect(commandFnSpy).toHaveBeenCalledWith(
        command,
        { query: multiplePathQuery },
        expect.any(Function),
      );
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn}' should handle single path`, () => {
    const token = connFn.call(conn, singlePathQuery, callback, options);

    expect(callback).not.toHaveBeenCalled();
    if (isSearch) {
      expect(commandFnSpy).toHaveBeenCalledWith(
        { query: singlePathQuery, ...SEARCH_OPTIONS },
        expect.any(Function),
      );
    } else {
      expect(commandFnSpy).toHaveBeenCalledWith(
        command,
        { query: singlePathQuery },
        expect.any(Function),
      );
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn}' should handle root path`, () => {
    const token = connFn.call(conn, rootQuery, callback, options);

    expect(callback).not.toHaveBeenCalled();
    if (isSearch) {
      expect(commandFnSpy).toHaveBeenCalledWith(
        { query: rootQuery, ...SEARCH_OPTIONS },
        expect.any(Function),
      );
    } else {
      expect(commandFnSpy).toHaveBeenCalledWith(
        command,
        { query: rootQuery },
        expect.any(Function),
      );
    }
    expect(token).not.toBeNull();
  });

  test('should call callback with data', () => {
    const token = connFn.call(conn, rootQuery, callback, options);

    if (token) {
      // Send message
      conn.websocket.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify({ token, result: RESULT }),
        }),
      );

      expect(callback).toHaveBeenCalledWith(
        null,
        RESULT,
        undefined,
        token,
        createRequestContext(command, token, rootQuery, options),
      );
    }

    expect(token).not.toBeNull();
  });

  test('should call callback with error', () => {
    const token = connFn.call(conn, rootQuery, callback, options);

    if (token) {
      // Send message
      conn.websocket.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify({
            token,
            error: ERROR_MESSAGE,
            status: ERROR_STATUS,
          }),
        }),
      );

      expect(callback).toHaveBeenCalledWith(
        expect.stringContaining(ERROR_MESSAGE),
        undefined,
        ERROR_STATUS,
        token,
        createRequestContext(command, token, rootQuery, options),
      );
    }

    expect(token).not.toBeNull();
  });
});

describe.each([
  ['getAndSubscribe', GET_AND_SUBSCRIBE],
  ['subscribe', SUBSCRIBE],
  ['searchSubscribe', SEARCH_SUBSCRIBE, true],
  ['runStreamingService', SERVICE_REQUEST, false, true],
])('Subscribe Queries', (fn, command, isSearch?, isService?) => {
  const callback = jest.fn();
  const options = {} as Options & SearchOptions;
  let conn: Connector;
  let commandFnSpy: jest.SpyInstance;
  let connFn: (
    q: Query | ServiceRequest,
    cb: NotifCallback,
    o?: SearchOptions | Options,
  ) => SubscriptionIdentifier | null;
  const RESULT = { dataset: 'Dodgers' };

  function createRequestContext(
    c: string,
    token: string,
    queryOrRequest: Query | ServiceRequest,
    o: SearchOptions | Options,
  ): RequestContext {
    let params: ServiceRequest | SearchParams | QueryParams = { query: queryOrRequest as Query };
    if (isSearch && !isService) {
      const sanitizedSearchOptions = sanitizeSearchOptions(o as SearchOptions);
      params = {
        query: queryOrRequest as Query,
        search: sanitizedSearchOptions.search,
        searchType: sanitizedSearchOptions.searchType,
      };
    }
    if (command === GET_AND_SUBSCRIBE) {
      const sanitizedOptions = sanitizeOptions(o as Options);
      params = {
        query: queryOrRequest as Query,
        start: sanitizedOptions.start,
        end: sanitizedOptions.end,
        versions: sanitizedOptions.versions,
      };
    }
    if (isService) {
      params = queryOrRequest as ServiceRequest;
    }
    return {
      command: c as WsCommand,
      token,
      encodedParams: toBinaryKey(params),
    };
  }

  beforeEach(() => {
    conn = new Connector();
    // @ts-expect-error Easier than typing everything
    connFn = conn[fn];
    commandFnSpy = jest.spyOn(conn, 'stream');
    conn.run('ws://localhost:8080');
    conn.websocket.dispatchEvent(new MessageEvent('open', {}));
  });

  afterEach(() => {
    callback.mockClear();
    commandFnSpy.mockClear();
  });

  test(`'${fn}' should handle empty query`, () => {
    const query: Query = [];

    if (isSearch || isService) {
      const subscriptionId = connFn.call(conn, query, callback);

      expect(commandFnSpy).toHaveBeenCalledTimes(1);
      expect(callback).not.toHaveBeenCalled();
      expect(subscriptionId).not.toBeNull();
    } else {
      const subscriptionId = connFn.call(conn, query, callback);

      expect(commandFnSpy).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledTimes(1);
      expect(subscriptionId).toBeNull();
    }
  });

  test(`'${fn}' should handle invalid query`, () => {
    const query = undefined;
    // @ts-expect-error Easier than typing everything
    const subscriptionId = connFn.call(conn, query, callback);

    expect(commandFnSpy).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(subscriptionId).toBeNull();
  });

  test(`'${fn}' should handle invalid options`, () => {
    const subscriptionId = connFn.call(conn, isService ? serviceQuery : singlePathQuery, callback, {
      start: 10,
      end: 5,
    });
    if (isSearch) {
      expect(subscriptionId).not.toBeNull();
      expect(callback).not.toHaveBeenCalled();
      expect(commandFnSpy).toHaveBeenCalledWith(
        command,
        { query: singlePathQuery, ...SEARCH_OPTIONS },
        expect.any(Function),
      );
    } else if (isService) {
      expect(subscriptionId).not.toBeNull();
      expect(callback).not.toHaveBeenCalled();
      expect(commandFnSpy).toHaveBeenCalledWith(command, serviceQuery, expect.any(Function));
    } else if (command === GET_AND_SUBSCRIBE) {
      expect(commandFnSpy).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledTimes(1);
      expect(subscriptionId).toBeNull();
    } else {
      expect(subscriptionId).not.toBeNull();
      expect(callback).not.toHaveBeenCalled();
      expect(commandFnSpy).toHaveBeenCalledWith(
        command,
        { query: singlePathQuery },
        expect.any(Function),
      );
    }
  });

  test(`'${fn}' should handle multiple paths`, () => {
    // Service does not support multiple path query;
    if (isService) {
      return;
    }
    const subscriptionId = connFn.call(conn, multiplePathQuery, callback, options);

    expect(callback).not.toHaveBeenCalled();
    if (isSearch) {
      expect(commandFnSpy).toHaveBeenCalledWith(
        command,
        { query: multiplePathQuery, ...SEARCH_OPTIONS },
        expect.any(Function),
      );
    } else {
      expect(commandFnSpy).toHaveBeenCalledWith(
        command,
        { query: multiplePathQuery },
        expect.any(Function),
      );
    }
    expect(subscriptionId).not.toBeNull();
  });

  test(`'${fn}' should handle single path`, () => {
    const subscriptionId = connFn.call(
      conn,
      isService ? serviceQuery : singlePathQuery,
      callback,
      options,
    );
    expect(callback).not.toHaveBeenCalled();
    if (isSearch) {
      expect(commandFnSpy).toHaveBeenCalledWith(
        command,
        { query: singlePathQuery, ...SEARCH_OPTIONS },
        expect.any(Function),
      );
    } else if (isService) {
      expect(commandFnSpy).toHaveBeenCalledWith(command, serviceQuery, expect.any(Function));
    } else {
      expect(commandFnSpy).toHaveBeenCalledWith(
        command,
        { query: singlePathQuery },
        expect.any(Function),
      );
    }
    expect(subscriptionId).not.toBeNull();
  });

  test(`'${fn}' should handle root path`, () => {
    // This test is not valid for service
    if (isService) {
      return;
    }
    const subscriptionId = connFn.call(conn, rootQuery, callback, options);

    expect(callback).not.toHaveBeenCalled();
    if (isSearch) {
      expect(commandFnSpy).toHaveBeenCalledWith(
        command,
        { query: rootQuery, ...SEARCH_OPTIONS },
        expect.any(Function),
      );
    } else {
      expect(commandFnSpy).toHaveBeenCalledWith(
        command,
        { query: rootQuery },
        expect.any(Function),
      );
    }
    expect(subscriptionId).not.toBeNull();
  });

  test(`'${fn}' should call callback with data`, () => {
    const q = isService ? serviceQuery : rootQuery;
    const subscriptionId = connFn.call(conn, q, callback, options);
    if (subscriptionId) {
      // Send message
      conn.websocket.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify({ token: subscriptionId.token, result: RESULT }),
        }),
      );

      expect(callback).toHaveBeenCalledWith(
        null,
        RESULT,
        undefined,
        subscriptionId.token,
        createRequestContext(command, subscriptionId.token, q, { search: '' }),
      );
    }

    expect(subscriptionId).not.toBeNull();
  });

  test(`'${fn}' should call callback with error`, () => {
    const q = isService ? serviceQuery : rootQuery;
    const subscriptionId = connFn.call(conn, q, callback, options);

    if (subscriptionId) {
      // Send message
      conn.websocket.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify({
            token: subscriptionId.token,
            error: ERROR_MESSAGE,
            status: ERROR_STATUS,
          }),
        }),
      );

      expect(callback).toHaveBeenCalledWith(
        expect.stringContaining(ERROR_MESSAGE),
        undefined,
        ERROR_STATUS,
        subscriptionId.token,
        createRequestContext(command, subscriptionId.token, q, { search: '' }),
      );
    }

    expect(subscriptionId).not.toBeNull();
  });
});
