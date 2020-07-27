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

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import {
  APP_DATASET_TYPE,
  DEVICE_DATASET_TYPE,
  EOF,
  EOF_CODE,
  ERROR,
  GET,
  SEARCH_TYPE_ANY,
  SEARCH_TYPE_IP,
  SEARCH_TYPE_MAC,
  SUBSCRIBE,
} from '../src/constants';
import Emitter from '../src/emitter';
import { log } from '../src/logger';
import {
  createCloseParams,
  hashObject,
  invalidParamMsg,
  isMicroSeconds,
  isValidArg,
  makeNotifCallback,
  makePublishCallback,
  makeToken,
  sanitizeOptions,
  sanitizeSearchOptions,
  toBinaryKey,
  validateOptions,
  validateQuery,
  validateResponse,
} from '../src/utils';
import {
  CloseParams,
  CloudVisionDatasets,
  CloudVisionNotifs,
  CloudVisionParams,
  CloudVisionServiceResult,
  CloudVisionStatus,
  Options,
  Query,
  RequestContext,
  SearchOptions,
  SubscriptionIdentifier,
  WsCommand,
} from '../types';

const EOF_STATUS: CloudVisionStatus = {
  code: EOF_CODE,
};

jest.mock('../src/logger', () => {
  return { log: jest.fn() };
});
jest.spyOn(console, 'groupCollapsed').mockImplementation();

function createRequestContext(command: WsCommand, token: string, params: unknown): RequestContext {
  return {
    command,
    token,
    encodedParams: toBinaryKey(params),
  };
}

describe('invalidParamMsg', () => {
  test('should generate a proper error message given parameters', () => {
    const message = invalidParamMsg(10, 20, 1);

    expect(message).toBe('invalid params: start: 10, end: 20, versions: 1');
  });
});

describe('sanitizeOptions', () => {
  test('should convert millisecond timestamps to microseconds', () => {
    const options: Options = {
      start: 1498053512,
      end: 1498093512,
    };

    expect(sanitizeOptions(options)).toEqual<Options>({
      start: options.start! * 1e6,
      end: options.end! * 1e6,
      versions: undefined,
    });
  });

  test('should not convert microseconds timestamps', () => {
    const options: Options = {
      start: 1498053512 * 1e6,
      end: 1498093512 * 1e6,
    };

    expect(sanitizeOptions(options)).toEqual<Options>({
      ...options,
      versions: undefined,
    });
  });

  test('should convert float timestamps', () => {
    const options: Options = {
      start: 1498053512.589,
      end: 1498093512.1,
    };

    expect(sanitizeOptions(options)).toEqual<Options>({
      start: 1498053512 * 1e6,
      end: 1498093512 * 1e6,
      versions: undefined,
    });
  });

  test('should convert float version', () => {
    const options: Options = {
      versions: 10.5,
    };

    expect(sanitizeOptions(options)).toEqual<Options>({
      start: undefined,
      end: undefined,
      versions: 10,
    });
  });
});

describe('isValidArg', () => {
  test('should return true for numbers', () => {
    expect(isValidArg(2)).toBe(true);
  });

  test('should return false for numbers less than 0', () => {
    expect(isValidArg(-1)).toBe(false);
  });

  test('should return false for 0', () => {
    expect(isValidArg(0)).toBe(false);
  });

  test('should return true for floats', () => {
    expect(isValidArg(2.2)).toBe(true);
  });
});

describe('isMicroSeconds', () => {
  test('should return true for microsecond timestamps', () => {
    expect(isMicroSeconds(1505254217000000)).toBe(true);
  });

  test('should return false for non microseconds timestamps', () => {
    expect(isMicroSeconds(1505254217)).toBe(false);
  });
});

describe('validateOptions', () => {
  const spyCallback = jest.fn();

  beforeEach(() => {
    spyCallback.mockReset();
  });

  test('should pass validation if start < end', () => {
    const options: Options = {
      start: 1000,
      end: 2000,
    };

    expect(validateOptions(options, spyCallback)).toBe(true);
    expect(spyCallback).not.toHaveBeenCalled();
  });

  test('should pass validation if start given but not end', () => {
    const options: Options = {
      start: 2000,
    };

    expect(validateOptions(options, spyCallback)).toBe(true);
    expect(spyCallback).not.toHaveBeenCalled();
  });

  test('should not pass validation if start > end', () => {
    const options: Options = {
      start: 2000,
      end: 1000,
    };

    expect(validateOptions(options, spyCallback)).toBe(false);
    expect(spyCallback).toHaveBeenCalledTimes(1);
  });

  test('should not pass validation if start === end', () => {
    const options: Options = {
      start: 2000,
      end: 2000,
    };

    expect(validateOptions(options, spyCallback)).toBe(false);
    expect(spyCallback).toHaveBeenCalledTimes(1);
  });

  test('should not pass validation if start and versions are defined', () => {
    const options: Options = {
      start: 2000,
      versions: 10,
    };

    expect(validateOptions(options, spyCallback)).toBe(false);
    expect(spyCallback).toHaveBeenCalledTimes(1);
  });
});

describe('validateQuery', () => {
  const spyCallback = jest.fn();

  beforeEach(() => {
    spyCallback.mockReset();
  });

  test('should pass validation if query is an array with elements', () => {
    const query = [{}];

    // @ts-ignore explicity testings an invalid input
    expect(validateQuery(query, spyCallback)).toBe(true);
    expect(spyCallback).not.toHaveBeenCalled();
  });

  test('should fail validation if query is an array without elements', () => {
    const query: Query = [];

    expect(validateQuery(query, spyCallback)).toBe(false);
    expect(spyCallback).toHaveBeenCalledTimes(1);
  });

  test('should pass validation if query is an empty array and we explicitly allow it', () => {
    const query: Query = [];

    expect(validateQuery(query, spyCallback, true)).toBe(true);
    expect(spyCallback).not.toHaveBeenCalled();
  });

  test('should fail validation if query is not an array', () => {
    const query = {};

    // @ts-ignore explicity testings an invalid input
    expect(validateQuery(query, spyCallback)).toBe(false);
    expect(spyCallback).toHaveBeenCalledTimes(1);
  });

  test('should fail validation if query is undefined', () => {
    const query = undefined;

    // @ts-ignore explicity testings an invalid input
    expect(validateQuery(query, spyCallback)).toBe(false);
    expect(spyCallback).toHaveBeenCalledTimes(1);
  });
});

describe('hashObject', () => {
  test('should return equal hashes for equal objects', () => {
    const creators = [
      () => ({ a: 1, b: 2, c: 'test' }),
      () => ({ a: { b: { c: { d: 1, e: 'hello' }, f: 89 } } }),
    ];
    creators.forEach((creator) => {
      expect(hashObject(creator())).toEqual(hashObject(creator()));
    });
  });

  test('should return different hashes for different simple objects', () => {
    expect(hashObject({ a: 'silver' })).not.toEqual(hashObject({ a: 'gold' }));
    expect(hashObject({ a: 'silver' })).not.toEqual(hashObject({ b: 'silver' }));
    expect(hashObject({ a: 1, b: 2 })).not.toEqual(hashObject({ a: 2, b: 1 }));
  });

  test('should return different hashes for different deep objects', () => {
    expect(hashObject({ a: { b: 'c' } })).not.toEqual(hashObject({ a: { d: 'e' } }));
    expect(hashObject({ a: { b: 'c' } })).not.toEqual(hashObject({ a: { b: 7 } }));
    expect(hashObject({ a: { b: 'c' } })).not.toEqual(hashObject({ a: { c: 'b' } }));
    expect(hashObject({ a: { b: [1, 2, 3] } })).not.toEqual(hashObject({ a: { b: [1, 23] } }));
  });

  test('should return different hashes for deep objects differing only in top-level key', () => {
    const apples = { apples: { count: 5 } };
    const oranges = { oranges: { count: 5 } };

    expect(hashObject(apples)).not.toEqual(hashObject(oranges));
  });
});

describe('makeToken', () => {
  test('should make token using hashObject', () => {
    const command = GET;
    const params: CloudVisionParams = {
      hello: true,
    };
    const expectedToken = hashObject({
      command,
      params,
    });

    const token = makeToken(command, params);

    expect(token).toBe(expectedToken);
  });
});

describe('makeNotifCallback', () => {
  const token = 'Dodgers';
  const callbackSpy = jest.fn();
  const requestContext = createRequestContext(GET, token, {});

  beforeEach(() => {
    callbackSpy.mockReset();
  });

  test('not invoke the callback if there is no data', () => {
    const notifCallback = makeNotifCallback(callbackSpy);

    notifCallback(null, undefined);

    expect(callbackSpy).not.toHaveBeenCalled();
  });

  test('should send undefined on `EOF`', () => {
    const notifCallback = makeNotifCallback(callbackSpy);

    notifCallback(EOF, undefined, EOF_STATUS, token, requestContext);

    expect(callbackSpy).toHaveBeenCalledTimes(1);
    expect(callbackSpy).toHaveBeenCalledWith(null, undefined, EOF_STATUS, token, requestContext);
  });

  test('should invoke a callack with the result, when there is no error', () => {
    const notifCallback = makeNotifCallback(callbackSpy);
    const notif: CloudVisionNotifs = {
      dataset: { name: 'device1', type: DEVICE_DATASET_TYPE },
      metadata: {},
      notifications: [
        { path_elements: ['path1'], timestamp: 101000002000000 },
        { path_elements: ['path1'], timestamp: 103000004000000 },
      ],
    };

    notifCallback(null, notif, undefined, token, requestContext);

    expect(callbackSpy).toHaveBeenCalledTimes(1);
    expect(callbackSpy).toHaveBeenCalledWith(null, notif, undefined, token, requestContext);
  });

  test('should invoke the callback properly for dataset responses', () => {
    const notifCallback = makeNotifCallback(callbackSpy);
    const notif: CloudVisionDatasets = {
      datasets: [
        {
          type: DEVICE_DATASET_TYPE,
          name: 'device1',
        },
        {
          type: APP_DATASET_TYPE,
          name: 'app1',
        },
      ],
      metadata: {},
    };

    notifCallback(null, notif, undefined, token, requestContext);

    expect(callbackSpy).toHaveBeenCalledTimes(1);
    expect(callbackSpy).toHaveBeenCalledWith(null, notif, undefined, token, requestContext);
  });

  test('should invoke the callback properly for service responses', () => {
    const notifCallback = makeNotifCallback(callbackSpy);
    const notif: CloudVisionServiceResult = {
      Dodgers: 'the best team in baseball',
    };

    notifCallback(null, notif, undefined, token, requestContext);

    expect(callbackSpy).toHaveBeenCalledTimes(1);
    expect(callbackSpy).toHaveBeenCalledWith(null, notif, undefined, token, requestContext);
  });

  test('should invoke the callback if there is an error', () => {
    const notifCallback = makeNotifCallback(callbackSpy);
    const errorText = 'Some Error';

    notifCallback(errorText, undefined, undefined, token, requestContext);

    expect(callbackSpy).toHaveBeenCalledTimes(2);
    expect(callbackSpy).toHaveBeenLastCalledWith(
      null,
      undefined,
      { code: EOF_CODE },
      token,
      requestContext,
    );
    expect(callbackSpy.mock.calls[0][0]).toContain(errorText);
  });
});

describe('createCloseParams', () => {
  let emitter: Emitter;
  const streamCallback = jest.fn();
  const streamToken = 'DodgerBlue';
  const stream: SubscriptionIdentifier = {
    token: streamToken,
    callback: streamCallback,
  };
  const streamCallback2 = jest.fn();
  const streamToken2 = 'VinScully';
  const stream2: SubscriptionIdentifier = {
    token: streamToken2,
    callback: streamCallback2,
  };

  const requestContext = createRequestContext(SUBSCRIBE, streamToken, {});
  const requestContext2 = createRequestContext(SUBSCRIBE, streamToken2, {});

  beforeEach(() => {
    emitter = new Emitter();
    emitter.bind(streamToken, requestContext, streamCallback);
    emitter.bind(streamToken2, requestContext2, streamCallback2);
  });

  test('should create the proper stream close params for one stream', () => {
    const expectedCloseParams: CloseParams = { [streamToken]: true };
    const closeParams = createCloseParams(stream, emitter);

    expect(closeParams).toEqual(expectedCloseParams);
    expect(streamCallback).not.toHaveBeenCalled();
    expect(emitter.getEventsMap().get(streamToken)).toBeUndefined();
  });

  test('should create the proper stream close params for multiple streams', () => {
    const streams = [stream, stream2];
    const expectedCloseParams: CloseParams = { [streamToken]: true, [streamToken2]: true };
    const closeParams = createCloseParams(streams, emitter);

    expect(closeParams).toEqual(expectedCloseParams);
    expect(streamCallback).not.toHaveBeenCalled();
    expect(emitter.getEventsMap().get(streamToken)).toBeUndefined();
    expect(streamCallback2).not.toHaveBeenCalled();
    expect(emitter.getEventsMap().get(streamToken2)).toBeUndefined();
  });

  test(
    'should create the proper stream close params if a stream has multiple callbacks and only ' +
      'one is unbound',
    () => {
      const anotherCallback = jest.fn();
      const expectedCloseParams = null;
      emitter.bind(streamToken, requestContext, anotherCallback);

      const closeParams = createCloseParams(stream, emitter);

      expect(closeParams).toEqual(expectedCloseParams);
      expect(streamCallback).not.toHaveBeenCalled();
      expect(emitter.getEventsMap().get(streamToken)).toEqual([anotherCallback]);
      expect(anotherCallback).not.toHaveBeenCalled();
    },
  );

  test(
    'should create the proper stream close params if a stream has multiple callbacks and ' +
      'all are unbound',
    () => {
      const anotherCallback = jest.fn();
      const expectedCloseParams: CloseParams = { [streamToken]: true };
      const annotherStream: SubscriptionIdentifier = {
        token: streamToken,
        callback: anotherCallback,
      };
      const streams = [stream, annotherStream];
      emitter.bind(streamToken, requestContext, anotherCallback);

      const closeParams = createCloseParams(streams, emitter);

      expect(closeParams).toEqual(expectedCloseParams);
      expect(streamCallback).not.toHaveBeenCalled();
      expect(emitter.getEventsMap().get(streamToken)).toBeUndefined();
      expect(anotherCallback).not.toHaveBeenCalled();
    },
  );
});

describe('makePublishCallback', () => {
  const callbackSpy = jest.fn();
  beforeEach(() => {
    callbackSpy.mockReset();
  });

  test('should have proper callback on EOF', () => {
    const publishCallback = makePublishCallback(callbackSpy);
    publishCallback(EOF, undefined, EOF_STATUS);

    expect(callbackSpy).toHaveBeenCalledWith(true);
  });

  test('should have proper callback on Error', () => {
    const publishCallback = makePublishCallback(callbackSpy);
    const err = 'SomeError';
    const expectedErrMsg = `Error: ${err}\n`;
    publishCallback(err);

    expect(callbackSpy).toHaveBeenCalledWith(false, expectedErrMsg);
  });

  test('should not callback when no error or no EOF', () => {
    const publishCallback = makePublishCallback(callbackSpy);
    const err = null;
    publishCallback(err);

    expect(callbackSpy).not.toHaveBeenCalled();
  });
});

describe('validateResponse', () => {
  const token = 'some token';

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('should not log an error for a valid response', () => {
    const notifResponse: CloudVisionNotifs = {
      dataset: { name: 'Max', type: APP_DATASET_TYPE },
      metadata: {},
      notifications: [{ path_elements: ['Muncy'], timestamp: 1 }],
    };
    const datasetResponse: CloudVisionDatasets = {
      datasets: [{ name: 'Max', type: APP_DATASET_TYPE }],
      metadata: {},
    };

    validateResponse(notifResponse, {}, token, false);
    validateResponse(datasetResponse, {}, token, false);

    expect(log).not.toHaveBeenCalled();
  });

  test('should log an error for a response with a non array type for notifications', () => {
    const response: CloudVisionNotifs = {
      // @ts-ignore explicity testings an invalid input
      dataset: { name: 'Max', type: APP_DATASET_TYPE },
      // @ts-ignore explicity testings an invalid input
      notifications: { lastName: 'Muncy' },
    };
    validateResponse(response, {}, token, false);
    expect(log).toHaveBeenCalledWith(
      ERROR,
      "Key 'notifications' is not an array",
      undefined,
      token,
    );
  });

  test('should log an error for a response without notifications', () => {
    // @ts-ignore explicity testings an invalid input
    const response: CloudVisionNotifs = { dataset: { name: 'Max', type: 'beast' } };
    validateResponse(response, {}, token, false);
    expect(log).toHaveBeenCalledWith(
      ERROR,
      "No key 'notifications' found in response",
      undefined,
      token,
    );
  });

  test('should log an error for a response without type for dataset', () => {
    // @ts-ignore explicity testings an invalid input
    const response: CloudVisionNotifs = { dataset: { name: 'Max' } };
    validateResponse(response, {}, token, false);
    expect(log).toHaveBeenCalledWith(ERROR, "No key 'type' found in dataset", undefined, token);
  });

  test('should log an error for a response without name for dataset', () => {
    // @ts-ignore explicity testings an invalid input
    const response: CloudVisionNotifs = { dataset: {} };
    validateResponse(response, {}, token, false);
    expect(log).toHaveBeenCalledWith(ERROR, "No key 'name' found in dataset", undefined, token);
  });

  test('should not log an error for a status response', () => {
    // @ts-ignore explicity testings an invalid input
    const response: CloudVisionNotifs = {};
    validateResponse(response, { code: 1101 }, token, false);
    expect(log).not.toHaveBeenCalledWith();
  });
  /* eslint-enable no-console */
});

describe('sanitizeSearchOptions', () => {
  test('should return `ANY` as search type if none is given', () => {
    const searchOptions: SearchOptions = { search: 'Dodgers' };

    expect(sanitizeSearchOptions(searchOptions)).toEqual<SearchOptions>({
      search: 'Dodgers',
      searchType: SEARCH_TYPE_ANY,
    });
  });

  test('should return `ANY` as search type, if the type does not match a proper search type', () => {
    const searchOptions: SearchOptions = { search: 'Dodgers' };

    expect(sanitizeSearchOptions(searchOptions)).toEqual<SearchOptions>({
      search: 'Dodgers',
      searchType: SEARCH_TYPE_ANY,
    });
  });

  test('should return the given search type, if it matches a proper search type', () => {
    const searchOptionsMac: SearchOptions = { search: 'Dodgers', searchType: SEARCH_TYPE_MAC };
    const searchOptionsAny: SearchOptions = { search: 'Dodgers', searchType: SEARCH_TYPE_ANY };
    const searchOptionsIp: SearchOptions = { search: 'Dodgers', searchType: SEARCH_TYPE_IP };

    expect(sanitizeSearchOptions(searchOptionsMac)).toEqual<SearchOptions>({
      search: 'Dodgers',
      searchType: SEARCH_TYPE_MAC,
    });
    expect(sanitizeSearchOptions(searchOptionsAny)).toEqual<SearchOptions>({
      search: 'Dodgers',
      searchType: SEARCH_TYPE_ANY,
    });
    expect(sanitizeSearchOptions(searchOptionsIp)).toEqual<SearchOptions>({
      search: 'Dodgers',
      searchType: SEARCH_TYPE_IP,
    });
  });
});
