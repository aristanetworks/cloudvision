/* eslint-env jest */

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
  EOF_CODE,
  GET_DATASETS,
  GET,
  SEARCH_SUBSCRIBE,
  SEARCH_TYPE_ANY,
  SEARCH_TYPE_MAC,
  SEARCH,
  SUBSCRIBE,
} from '../src/constants';
import Connector from '../src/index';

const EXACT_PATH_TYPE = 'EXACT';

const ACTIVE_STATUS = {
  code: ACTIVE_CODE,
  messages: 'Active',
};

describe('getDatasets', () => {
  let conn;
  let spyCallback;

  beforeEach(() => {
    conn = new Connector();
    jest.spyOn(conn, 'get');
    spyCallback = jest.fn();
  });

  test('should get all datasets', () => {
    conn.getDatasets(spyCallback);

    expect(conn.get).toHaveBeenCalledWith(
      GET_DATASETS,
      { types: [APP_DATASET_TYPE, DEVICE_DATASET_TYPE] },
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
});

describe('getAndSubscribe', () => {
  const closeFn = () => {};
  const callback = jest.fn();
  let conn;

  beforeEach(() => {
    conn = new Connector();
    jest.spyOn(conn, 'stream').mockImplementation(() => closeFn);
  });

  test('should not modify paths with trailing slashes', () => {
    const dataset = 'deviceFoo';
    const trailingSlashPath = '/this/path/has/a/trailing/slash/';
    const query = [{
      dataset: { type: DEVICE_DATASET_TYPE, name: dataset },
      paths: [{ type: EXACT_PATH_TYPE, path: trailingSlashPath }],
    }];

    conn.getAndSubscribe(query, callback);

    expect(conn.stream).toHaveBeenCalledWith(SUBSCRIBE, { query }, expect.any(Function));
  });

  test('should handle subscribing to "/"', () => {
    const dataset = 'deviceFoo';
    const rootPath = '/';
    const query = [{
      dataset: { type: DEVICE_DATASET_TYPE, name: dataset },
      paths: [{ type: EXACT_PATH_TYPE, path: rootPath }],
    }];

    conn.getAndSubscribe(query, callback);
    expect(conn.stream).toHaveBeenCalledWith(SUBSCRIBE, { query }, expect.any(Function));
  });

  test('should handle subscribing to multiple paths', () => {
    const dataset = 'deviceFoo';
    const paths = ['/this/is/the/first/path', '/and/this/is/the/second'];
    const query = [{
      dataset: { type: DEVICE_DATASET_TYPE, name: dataset },
      paths: [{ type: EXACT_PATH_TYPE, path: paths[0] }, { type: EXACT_PATH_TYPE, path: paths[1] }],
    }];

    conn.getAndSubscribe(query, callback);

    expect(conn.stream).toHaveBeenCalledWith(SUBSCRIBE, { query }, expect.any(Function));
  });

  test('should subscribe, wait for active acknowledgement and then call get', () => {
    const dataset = 'deviceFoo';
    const paths = ['/this/is/the/first/path', '/and/this/is/the/second'];
    const query = [{
      dataset: { type: DEVICE_DATASET_TYPE, name: dataset },
      paths: [{ type: EXACT_PATH_TYPE, path: paths[0] }, { type: EXACT_PATH_TYPE, path: paths[1] }],
    }];
    jest.spyOn(conn, 'stream').mockImplementationOnce(() => {});
    jest.spyOn(conn, 'stream').mockImplementationOnce((cmd, q, cb) => {
      cb(null, null, ACTIVE_STATUS);
    });
    jest.spyOn(conn, 'getWithOptions');

    conn.getAndSubscribe(query, callback);
    expect(conn.getWithOptions).not.toHaveBeenCalled();
    conn.getAndSubscribe(query, callback);

    expect(conn.stream).toHaveBeenCalledWith(SUBSCRIBE, { query }, expect.any(Function));
    expect(conn.getWithOptions).toHaveBeenCalledWith(query, callback, {});
  });

  test(
    'should callback with subscribe results, if the callback is not an active status call',
    () => {
      const dataset = 'deviceFoo';
      const paths = ['/this/is/the/first/path', '/and/this/is/the/second'];
      const query = [{
        dataset: { type: DEVICE_DATASET_TYPE, name: dataset },
        paths: [
          { type: EXACT_PATH_TYPE, path: paths[0] },
          { type: EXACT_PATH_TYPE, path: paths[1] },
        ],
      }];
      const result = { datasets: 'Go Dodgers!' };
      jest.spyOn(conn, 'stream').mockImplementationOnce((cmd, q, cb) => {
        cb(null, result, undefined);
      });
      jest.spyOn(conn, 'getWithOptions');

      conn.getAndSubscribe(query, callback);

      expect(conn.stream).toHaveBeenCalledWith(SUBSCRIBE, { query }, expect.any(Function));
      expect(conn.getWithOptions).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(null, result, undefined);
    },
  );
});

describe('getWithOptions', () => {
  const dataset = 'dataset';
  const path1 = 'path1';
  let conn;
  let spyCallback;

  beforeEach(() => {
    conn = new Connector();
    jest.spyOn(conn, 'getWithOptions');
    jest.spyOn(conn, 'getDatasets');
    jest.spyOn(conn, 'get');
    spyCallback = jest.fn();
  });

  test('should call `getDatasets` given `DEVICES_DATASET_ID`', () => {
    conn.getWithOptions(Connector.DEVICES_DATASET_ID, spyCallback);
    expect(conn.getDatasets).toHaveBeenCalledWith(spyCallback);
    expect(conn.get).toHaveBeenCalledWith(
      GET_DATASETS,
      { types: [APP_DATASET_TYPE, DEVICE_DATASET_TYPE] },
      expect.any(Function),
    );
  });

  test(
    'should callback error, if query is not a query object or a string command to get all datasets',
    () => {
      conn.getWithOptions('bestBaseballTeam', spyCallback);
      expect(spyCallback).toHaveBeenCalledWith('invalid command for `getWithOptions`');
    },
  );

  test('should make a request given a query', () => {
    const options = {};
    const query = [{
      dataset: { type: DEVICE_DATASET_TYPE, name: dataset },
      paths: [{ type: EXACT_PATH_TYPE, path: path1 }],
    }];
    const expectedOptions = {
      query, start: undefined, end: undefined, versions: undefined,
    };

    conn.getWithOptions(query, spyCallback, options);

    expect(conn.getWithOptions).toHaveBeenCalledWith(query, spyCallback, options);
    expect(spyCallback).not.toHaveBeenCalled();
    expect(conn.get).toHaveBeenCalledWith(GET, expectedOptions, expect.any(Function));
  });

  test('should invoke an error callback if options are invalid', () => {
    const options = { start: 5, end: 1 };
    const query = [{
      dataset: { type: DEVICE_DATASET_TYPE, name: dataset },
      paths: [{ type: EXACT_PATH_TYPE, path: path1 }],
    }];

    conn.getWithOptions(query, spyCallback, options);

    expect(conn.getWithOptions).toHaveBeenCalledWith(query, spyCallback, options);
    expect(spyCallback).toHaveBeenCalledTimes(1);
    expect(conn.get).not.toHaveBeenCalled();
  });

  test(
    'should execute callback with the proper error, if no query is given',
    () => {
      const options = {};
      conn.getWithOptions(null, spyCallback, options);

      expect(spyCallback).toHaveBeenCalledWith('`query` param must be an array');
      expect(spyCallback).toHaveBeenCalledTimes(1);
      expect(conn.get).not.toHaveBeenCalled();
    },
  );

  test(
    'should execute callback with the proper error, if query param is empty',
    () => {
      const options = {};
      const query = [];
      conn.getWithOptions(query, spyCallback, options);

      expect(spyCallback).toHaveBeenCalledWith('`query` param cannot be empty');
      expect(spyCallback).toHaveBeenCalledTimes(1);
      expect(conn.get).not.toHaveBeenCalled();
    },
  );
});

describe('subscribe', () => {
  test('should call stream with proper params', () => {
    const dataset = 'dataset';
    const path1 = 'path1';
    const query = [{
      dataset: { type: DEVICE_DATASET_TYPE, name: dataset },
      paths: [{ type: EXACT_PATH_TYPE, path: path1 }],
    }];
    const conn = new Connector();
    jest.spyOn(conn, 'stream');
    const spyCallback = jest.fn();

    conn.subscribe(query, spyCallback);

    expect(conn.stream).toHaveBeenCalledWith(SUBSCRIBE, { query }, expect.any(Function));
    if (spyCallback.mock.calls[0] && spyCallback.mock.calls[0][0] !== null) {
      // If there's an error, callback will be called twice
      expect(spyCallback).toHaveBeenCalledTimes(2);
      expect(spyCallback).toHaveBeenLastCalledWith(null, null, { code: EOF_CODE });
    } else {
      expect(spyCallback).toHaveBeenCalledTimes(1);
    }
  });
});

describe('closeSubscriptions', () => {
  const streamCallback = jest.fn();
  const streamToken = 'DodgerBlue';
  const streamCallback2 = jest.fn();
  const streamToken2 = 'VinScully';
  const subscriptions = [
    { token: streamToken, callback: streamCallback },
    { token: streamToken2, callback: streamCallback2 },
  ];

  test('should close multiple subsriptions in one call', () => {
    const conn = new Connector();
    jest.spyOn(conn, 'closeStreams');
    const spyCallback = jest.fn();

    conn.closeSubscriptions(subscriptions, spyCallback);

    expect(conn.closeStreams).toHaveBeenCalledWith(CLOSE, subscriptions, expect.any(Function));
    expect(spyCallback).not.toHaveBeenCalled();
  });

  test('should call the callback if the close fails', () => {
    const conn = new Connector();
    conn.eventsEmitter.bind(streamToken, streamCallback);
    jest.spyOn(conn, 'closeStreams');
    jest.spyOn(conn, 'sendMessage').mockImplementationOnce(() => {
      throw new Error('error');
    });
    const spyCallback = jest.fn();

    conn.closeSubscriptions(subscriptions, spyCallback);

    if (
      spyCallback.mock.calls[0] && spyCallback.mock.calls[0][0] !== null
    ) {
      // If there's an error, callback will be called twice
      expect(spyCallback).toHaveBeenCalledTimes(2);
      expect(spyCallback).toHaveBeenLastCalledWith(null, null, { code: EOF_CODE });
    } else {
      expect(spyCallback).toHaveBeenCalledTimes(1);
    }
  });
});

describe('writeSync', () => {
  test('should call writeSync with proper params', () => {
    const publishRequest = {
      datasetId: 'analytics',
      notifications: [{
        timestamp: 1,
        path: '/test',
        updates: {
          someKey: { key: 'someKey', value: 'somevalue' },
        },
      }],
    };

    const conn = new Connector();
    jest.spyOn(conn, 'writeSync');
    const spyCallback = jest.fn();

    conn.writeSync(publishRequest, spyCallback);
    expect(conn.writeSync).toHaveBeenCalledTimes(1);
    expect(conn.writeSync).toHaveBeenCalledWith(publishRequest, expect.any(Function));
    expect(spyCallback).toHaveBeenCalledTimes(1);
  });
});

describe('searchWithOptions', () => {
  const dataset = 'dataset';
  const path1 = 'path1';
  let conn;
  let spyCallback;
  const searchKeyword = 'Dodgers';

  beforeEach(() => {
    conn = new Connector();
    jest.spyOn(conn, 'search');
    jest.spyOn(conn, 'unsafeGet');
    spyCallback = jest.fn();
  });

  test('should not make a request if connector is not running', () => {
    const searchOptions = { search: searchKeyword, searchType: SEARCH_TYPE_MAC };
    const options = {};
    const query = [];
    const expectedOptions = {
      query, start: undefined, end: undefined, search: searchKeyword, searchType: SEARCH_TYPE_MAC,
    };

    conn.searchWithOptions(searchOptions, spyCallback, options, query);

    expect(conn.search).toHaveBeenCalledWith(SEARCH, expectedOptions, expect.any(Function));
    expect(spyCallback).not.toHaveBeenCalled();
    expect(conn.unsafeGet).not.toHaveBeenCalled();
  });

  test('should execute a request, if no query is given', () => {
    const searchOptions = {};
    const options = {};
    const expectedOptions = {
      query: [], start: undefined, end: undefined, search: undefined, searchType: SEARCH_TYPE_ANY,
    };

    conn.searchWithOptions(searchOptions, spyCallback, options);

    expect(conn.search).toHaveBeenCalledWith(SEARCH, expectedOptions, expect.any(Function));
    expect(spyCallback).not.toHaveBeenCalled();
  });

  test(
    'should execute callback with the proper error, if an invalid query is given',
    () => {
      const searchOptions = {};
      const options = {};
      const query = {
        dataset: { type: DEVICE_DATASET_TYPE, name: dataset },
      };
      conn.searchWithOptions(searchOptions, spyCallback, options, query);

      expect(spyCallback).toHaveBeenCalledWith('`query` param must be an array');
      expect(spyCallback).toHaveBeenCalledTimes(1);
      expect(conn.search).not.toHaveBeenCalled();
    },
  );

  test('should invoke an error callback if options are invalid', () => {
    const searchOptions = {};
    const options = { start: 5, end: 1 };
    const query = [{
      dataset: { type: DEVICE_DATASET_TYPE, name: dataset },
      paths: [{ type: EXACT_PATH_TYPE, path: path1 }],
    }];

    conn.searchWithOptions(searchOptions, spyCallback, options, query);

    expect(spyCallback).toHaveBeenCalledTimes(1);
    expect(conn.search).not.toHaveBeenCalled();
  });

  test('should make a request given a search keyword', () => {
    const searchOptions = { search: searchKeyword };
    const options = {};
    const query = [];
    const expectedOptions = {
      query, start: undefined, end: undefined, search: searchKeyword, searchType: SEARCH_TYPE_ANY,
    };

    conn.searchWithOptions(searchOptions, spyCallback, options, query);

    expect(conn.search).toHaveBeenCalledWith(SEARCH, expectedOptions, expect.any(Function));
    expect(spyCallback).not.toHaveBeenCalled();
  });

  test('should make a request given with the a specific search type', () => {
    const searchOptions = { search: searchKeyword, searchType: SEARCH_TYPE_MAC };
    const options = {};
    const query = [];
    const expectedOptions = {
      query, start: undefined, end: undefined, search: searchKeyword, searchType: SEARCH_TYPE_MAC,
    };

    conn.searchWithOptions(searchOptions, spyCallback, options, query);

    expect(conn.search).toHaveBeenCalledWith(SEARCH, expectedOptions, expect.any(Function));
    expect(spyCallback).not.toHaveBeenCalled();
  });

  test('should make a request given a search keyword and query', () => {
    const searchOptions = { search: searchKeyword };
    const options = {};
    const query = [{
      dataset: { type: DEVICE_DATASET_TYPE, name: dataset },
      paths: [{ type: EXACT_PATH_TYPE, path: path1 }],
    }];
    const expectedOptions = {
      query, start: undefined, end: undefined, search: searchKeyword, searchType: SEARCH_TYPE_ANY,
    };

    conn.searchWithOptions(searchOptions, spyCallback, options, query);

    expect(conn.search).toHaveBeenCalledWith(SEARCH, expectedOptions, expect.any(Function));
    expect(spyCallback).not.toHaveBeenCalled();
  });
});

describe('searchSubscribe', () => {
  const dataset = 'dataset';
  const path1 = 'path1';
  let conn;
  let spyCallback;
  const searchKeyword = 'Dodgers';

  beforeEach(() => {
    conn = new Connector();
    jest.spyOn(conn, 'stream');
    jest.spyOn(conn, 'unsafeGet');
    spyCallback = jest.fn();
  });

  test('should not make a request if connector is not running', () => {
    const searchOptions = { search: searchKeyword, searchType: SEARCH_TYPE_MAC };
    const options = {};
    const query = [];
    const expectedOptions = {
      query, search: searchKeyword, searchType: SEARCH_TYPE_MAC,
    };

    conn.searchSubscribe(searchOptions, query, spyCallback, options);

    expect(conn.stream)
      .toHaveBeenCalledWith(SEARCH_SUBSCRIBE, expectedOptions, expect.any(Function));
    expect(spyCallback).toHaveBeenCalledWith(
      expect.stringContaining('Error: Connection'), null, undefined,
    );
    expect(conn.unsafeGet).not.toHaveBeenCalled();
  });

  test('should make a request given a search keyword', () => {
    const searchOptions = { search: searchKeyword };
    const options = {};
    const query = [];
    const expectedOptions = {
      query, start: undefined, end: undefined, search: searchKeyword, searchType: SEARCH_TYPE_ANY,
    };

    conn.searchSubscribe(searchOptions, query, spyCallback, options);

    expect(conn.stream)
      .toHaveBeenCalledWith(SEARCH_SUBSCRIBE, expectedOptions, expect.any(Function));
  });

  test('should make a request given a search keyword and a search type', () => {
    const searchOptions = { search: searchKeyword, searchType: SEARCH_TYPE_MAC };
    const options = {};
    const query = [];
    const expectedOptions = {
      query, start: undefined, end: undefined, search: searchKeyword, searchType: SEARCH_TYPE_MAC,
    };

    conn.searchSubscribe(searchOptions, query, spyCallback, options);

    expect(conn.stream)
      .toHaveBeenCalledWith(SEARCH_SUBSCRIBE, expectedOptions, expect.any(Function));
  });

  test('should make a request given a search keyword and query', () => {
    const searchOptions = { search: searchKeyword };
    const options = {};
    const query = [{
      dataset: { type: DEVICE_DATASET_TYPE, name: dataset },
      paths: [{ type: EXACT_PATH_TYPE, path: path1 }],
    }];
    const expectedOptions = {
      query, start: undefined, end: undefined, search: searchKeyword, searchType: SEARCH_TYPE_ANY,
    };

    conn.searchSubscribe(searchOptions, query, spyCallback, options);

    expect(conn.stream)
      .toHaveBeenCalledWith(SEARCH_SUBSCRIBE, expectedOptions, expect.any(Function));
  });
});
