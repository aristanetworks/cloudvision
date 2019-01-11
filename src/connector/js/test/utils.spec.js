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
  APP_DATASET_TYPE,
  DEVICE_DATASET_TYPE,
  EOF_CODE,
  EOF,
  SEARCH_TYPE_ANY,
  SEARCH_TYPE_IP,
  SEARCH_TYPE_MAC,
} from '../src/constants';
import Emitter from '../src/emitter';
import {
  bigNumberParse,
  convertToMsTimestamp,
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
  toNotifBatch,
  validateOptions,
  validateQuery,
  validateResponse,
} from '../src/utils';

const EOF_STATUS = {
  code: EOF_CODE,
};

describe('invalidParamMsg', () => {
  test('should generate a proper error message given parameters', () => {
    const message = invalidParamMsg(10, 20, 1, false);

    expect(message).toBe('invalid params: start: 10, end: 20, versions: 1');
  });

  test(
    'should generate a proper error message given no parameters',
    () => {
      const message = invalidParamMsg();

      expect(message).toBe('invalid params: start: undefined, end: undefined, versions: undefined');
    },
  );
});

describe('sanitizeOptions', () => {
  test('should convert millisecond timestamps to microseconds', () => {
    const options = {
      start: 1498053512,
      end: 1498093512,
    };

    expect(sanitizeOptions(options)).toEqual({
      start: options.start * 1e6,
      end: options.end * 1e6,
      versions: undefined,
    });
  });

  test('should not convert microseconds timestamps', () => {
    const options = {
      start: 1498053512 * 1e6,
      end: 1498093512 * 1e6,
    };

    expect(sanitizeOptions(options)).toEqual({
      ...options,
      versions: undefined,
    });
  });

  test('should convert float timestamps', () => {
    const options = {
      start: 1498053512.589,
      end: 1498093512.10,
    };

    expect(sanitizeOptions(options)).toEqual({
      start: 1498053512 * 1e6,
      end: 1498093512 * 1e6,
      versions: undefined,
    });
  });

  test('should convert float version', () => {
    const options = {
      versions: 10.5,
    };

    expect(sanitizeOptions(options)).toEqual({
      start: undefined,
      end: undefined,
      versions: 10,
    });
  });

  test('should set invalid start and end to undefined', () => {
    const options = {
      start: 'invalid value',
      end: 'invalid value',
    };

    expect(sanitizeOptions(options)).toEqual({
      start: undefined,
      end: undefined,
      versions: undefined,
    });
  });

  test('should set invalid version to undefined', () => {
    const options = {
      versions: 'invalid value',
    };

    expect(sanitizeOptions(options)).toEqual({
      start: undefined,
      end: undefined,
      versions: undefined,
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

  test('should return false for numbers as strings', () => {
    expect(isValidArg('2')).toBe(false);
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
  let spyCallback;

  beforeEach(() => {
    spyCallback = jest.fn();
  });

  test('should pass validation if start < end', () => {
    const options = {
      start: 1000,
      end: 2000,
    };

    expect(validateOptions(options, spyCallback)).toBe(true);
    expect(spyCallback).not.toHaveBeenCalled();
  });

  test('should pass validation if start given but not end', () => {
    const options = {
      start: 2000,
    };

    expect(validateOptions(options, spyCallback)).toBe(true);
    expect(spyCallback).not.toHaveBeenCalled();
  });

  test('should not pass validation if start > end', () => {
    const options = {
      start: 2000,
      end: 1000,
    };

    expect(validateOptions(options, spyCallback)).toBe(false);
    expect(spyCallback).toHaveBeenCalledTimes(1);
  });

  test('should not pass validation if start === end', () => {
    const options = {
      start: 2000,
      end: 2000,
    };

    expect(validateOptions(options, spyCallback)).toBe(false);
    expect(spyCallback).toHaveBeenCalledTimes(1);
  });

  test(
    'should not pass validation if start and versions are defined',
    () => {
      const options = {
        start: 2000,
        versions: 10,
      };

      expect(validateOptions(options, spyCallback)).toBe(false);
      expect(spyCallback).toHaveBeenCalledTimes(1);
    },
  );
});

describe('validateQuery', () => {
  let spyCallback;

  beforeEach(() => {
    spyCallback = jest.fn();
  });

  test('should pass validation if query is an array with elements', () => {
    const query = [{}];

    expect(validateQuery(query, spyCallback)).toBe(true);
    expect(spyCallback).not.toHaveBeenCalled();
  });

  test(
    'should fail validation if query is an array without elements',
    () => {
      const query = [];

      expect(validateQuery(query, spyCallback)).toBe(false);
      expect(spyCallback).toHaveBeenCalledTimes(1);
    },
  );

  test(
    'should pass validation if query is an empty array and we explicitly allow it',
    () => {
      const query = [];

      expect(validateQuery(query, spyCallback, true)).toBe(true);
      expect(spyCallback).not.toHaveBeenCalled();
    },
  );

  test('should fail validation if query is not an array', () => {
    const query = {};

    expect(validateQuery(query, spyCallback)).toBe(false);
    expect(spyCallback).toHaveBeenCalledTimes(1);
  });

  test('should fail validation if query is undefined', () => {
    const query = undefined;

    expect(validateQuery(query, spyCallback)).toBe(false);
    expect(spyCallback).toHaveBeenCalledTimes(1);
  });
});

describe('bigNumberParse', () => {
  let spyCallback;

  beforeEach(() => {
    spyCallback = () => {};
  });

  test('should return false when message not mapped', () => {
    const map = new Map();
    map.set('EFG', [spyCallback]);
    expect(bigNumberParse('ABC', map)).toBe(false);
  });

  test('should return false when callback setting is undefined', () => {
    const map = new Map();
    map.set('ABC', [spyCallback]);
    expect(bigNumberParse('ABC', map)).toBe(false);
  });

  test('should return false when callback setting is true', () => {
    spyCallback.simple = true;
    const map = new Map();
    map.set('ABC', [spyCallback]);
    expect(bigNumberParse('ABC', map)).toBe(false);
  });

  test('should return true when callback setting is false', () => {
    spyCallback.simple = false;
    const map = new Map();
    map.set('ABC', [spyCallback]);
    expect(bigNumberParse('ABC', map)).toBe(true);
  });

  test('should return true when one callback setting is false', () => {
    const spyCallback2 = () => {};
    const spyCallback3 = () => {};
    spyCallback.simple = true;
    spyCallback2.simple = false;
    spyCallback3.simple = true;
    const map = new Map();
    map.set('ABC', [spyCallback, spyCallback2, spyCallback3]);
    expect(bigNumberParse('ABC', map)).toBe(true);
  });
});

describe('makeToken', () => {
  test('should make token using MurmurHash3', () => {
    const command = 'get';
    const params = {
      hello: 'hello',
    };
    const expectedToken = hashObject({
      command,
      params,
    });

    const token = makeToken(command, params);

    expect(token).toBe(expectedToken);
  });
});

describe('convertToMsTimestamp', () => {
  test('should notification timestamp to milliseconds', () => {
    const notif = {
      path: 'path1',
      timestamp: 1505851260000000000,
    };
    const expectedTimestamp = {
      path: notif.path,
      timestamp: 1505851260000,
    };

    const newNotif = convertToMsTimestamp(notif);

    expect(newNotif).toEqual(expectedTimestamp);
    expect(newNotif).not.toBe(expectedTimestamp);
  });
});

describe('toNotifBatch', () => {
  test('should properly batch requets for multiple paths', () => {
    const notif = {
      dataset: 'device1',
      notifications: [
        { path: 'path1', timestamp: 101000002000000 },
        { path: 'path2', timestamp: 102000003000000 },
        { path: 'path1', timestamp: 103000004000000 },
      ],
    };
    const expectedNotif = {
      dataset: 'device1',
      notifications: {
        path1: [
          { path: 'path1', timestamp: 101000002 },
          { path: 'path1', timestamp: 103000004 },
        ],
        path2: [
          { path: 'path2', timestamp: 102000003 },
        ],
      },
    };

    const batchedNotif = toNotifBatch(notif);

    expect(batchedNotif).toEqual(expectedNotif);
    expect(batchedNotif).not.toBe(expectedNotif);
  });

  test('should properly batch requets for one path', () => {
    const notif = {
      dataset: 'device1',
      notifications: [
        { path: 'path1', timestamp: 101000002000000 },
        { path: 'path1', timestamp: 103000004000000 },
      ],
    };
    const expectedNotif = {
      dataset: 'device1',
      notifications: {
        path1: [
          { path: 'path1', timestamp: 101000002 },
          { path: 'path1', timestamp: 103000004 },
        ],
      },
    };

    const batchedNotif = toNotifBatch(notif);

    expect(batchedNotif).toEqual(expectedNotif);
    expect(batchedNotif).not.toBe(expectedNotif);
  });
});

describe('makeNotifCallback', () => {
  let callbackSpy;

  beforeEach(() => {
    callbackSpy = jest.fn();
  });

  test('should create a proper callback', () => {
    const notifCallback = makeNotifCallback(callbackSpy);

    expect(notifCallback.simple).toBe(true);
  });

  test('should create a callback with `simple=true`', () => {
    callbackSpy.simple = true;
    const notifCallback = makeNotifCallback(callbackSpy);

    expect(notifCallback.simple).toBe(true);
  });

  test('should create a callback with `simple=false`', () => {
    callbackSpy.simple = false;
    const notifCallback = makeNotifCallback(callbackSpy);

    expect(notifCallback.simple).toBe(false);
  });

  test('should send null on `EOF`', () => {
    const notifCallback = makeNotifCallback(callbackSpy);

    notifCallback(EOF, null, EOF_STATUS);

    expect(callbackSpy).toHaveBeenCalledTimes(1);
    expect(callbackSpy).toHaveBeenCalledWith(null, null, EOF_STATUS);
  });

  test(
    'should invoke a callack with the result, when there is no error',
    () => {
      const notifCallback = makeNotifCallback(callbackSpy);
      const notif = {
        dataset: 'device1',
        notifications: [
          { path: 'path1', timestamp: 101000002000000 },
          { path: 'path1', timestamp: 103000004000000 },
        ],
      };

      notifCallback(null, notif);

      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(null, toNotifBatch(notif), undefined);
    },
  );

  test(
    'should not invoke the callback properly if the result is not an object',
    () => {
      const notifCallback = makeNotifCallback(callbackSpy);
      const result = ['Clayton Kershaw'];

      notifCallback(null, result);

      expect(callbackSpy).not.toHaveBeenCalled();
    },
  );

  test(
    'should not invoke the callback properly for dataset responses',
    () => {
      const notifCallback = makeNotifCallback(callbackSpy);
      const notif = {
        datasets: [{
          type: DEVICE_DATASET_TYPE,
          name: 'device1',
        }, {
          type: APP_DATASET_TYPE,
          name: 'app1',
        }],
      };

      notifCallback(null, notif);

      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(null, notif, undefined);
    },
  );

  test('should invoke the callback if there is an error', () => {
    const notifCallback = makeNotifCallback(callbackSpy);
    const errorText = 'Some Error';

    notifCallback(errorText);

    expect(callbackSpy).toHaveBeenCalledTimes(2);
    expect(callbackSpy).toHaveBeenLastCalledWith(null, null, { code: EOF_CODE });
    expect(callbackSpy.mock.calls[0][0]).toContain(errorText);
  });
});

describe('createCloseParams', () => {
  let emitter;
  const streamCallback = jest.fn();
  const streamToken = 'DodgerBlue';
  const stream = {
    token: streamToken,
    callback: streamCallback,
  };
  const streamCallback2 = jest.fn();
  const streamToken2 = 'VinScully';
  const stream2 = {
    token: streamToken2,
    callback: streamCallback2,
  };

  beforeEach(() => {
    emitter = new Emitter();
    emitter.bind(streamToken, streamCallback);
    emitter.bind(streamToken2, streamCallback2);
  });

  test(
    'should create the proper stream close params for one stream',
    () => {
      const expectedCloseParams = { [streamToken]: true };
      const closeParams = createCloseParams(stream, emitter);

      expect(closeParams).toEqual(expectedCloseParams);
      expect(streamCallback).not.toHaveBeenCalled();
      expect(emitter.getEventsMap().get(streamToken)).toBe(undefined);
    },
  );

  test(
    'should create the proper stream close params for multiple streams',
    () => {
      const streams = [stream, stream2];
      const expectedCloseParams = { [streamToken]: true, [streamToken2]: true };
      const closeParams = createCloseParams(streams, emitter);

      expect(closeParams).toEqual(expectedCloseParams);
      expect(streamCallback).not.toHaveBeenCalled();
      expect(emitter.getEventsMap().get(streamToken)).toBe(undefined);
      expect(streamCallback2).not.toHaveBeenCalled();
      expect(emitter.getEventsMap().get(streamToken2)).toBe(undefined);
    },
  );

  test(
    'should create the proper stream close params if a stream has multiple callbacks and only ' +
    'one is unbound',
    () => {
      const anotherCallback = jest.fn();
      const expectedCloseParams = null;
      emitter.bind(streamToken, anotherCallback);

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
      const expectedCloseParams = { [streamToken]: true };
      const annotherStream = {
        token: streamToken,
        callback: anotherCallback,
      };
      const streams = [stream, annotherStream];
      emitter.bind(streamToken, anotherCallback);

      const closeParams = createCloseParams(streams, emitter);

      expect(closeParams).toEqual(expectedCloseParams);
      expect(streamCallback).not.toHaveBeenCalled();
      expect(emitter.getEventsMap().get(streamToken)).toBe(undefined);
      expect(anotherCallback).not.toHaveBeenCalled();
    },
  );
});

describe('makePublishCallback', () => {
  let callbackSpy;
  beforeEach(() => {
    callbackSpy = jest.fn();
  });

  test('should have proper callback on EOF', () => {
    const publishCallback = makePublishCallback(callbackSpy);
    publishCallback(EOF, EOF_STATUS);

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
    jest.spyOn(console, 'error');
  });

  /* eslint-disable no-console */
  it('should not log an error for a valid response', () => {
    validateResponse(
      { dataset: { name: 'Max', type: 'beast' }, notifications: [{ lastName: 'Muncy' }] },
      {},
      token,
    );
    validateResponse({ datasets: [{ type: 'beast', name: 'Max' }] }, {}, token);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('should log an error for a response with a non array type for notifcations', () => {
    validateResponse(
      { dataset: { name: 'Max', type: 'beast' }, notifications: { lastName: 'Muncy' } },
      {},
      token,
    );
    expect(console.error).toHaveBeenCalledWith(
      `Key 'notifications' is not an array for token ${token}`,
    );
  });

  it('should log an error for a response without notifcations', () => {
    validateResponse({ dataset: { name: 'Max', type: 'beast' } }, {}, token);
    expect(console.error).toHaveBeenCalledWith(
      `No key 'notifications' found in response for token ${token}`,
    );
  });

  it('should log an error for a response without type for dataset', () => {
    validateResponse({ dataset: { name: 'Max' } }, {}, token);
    expect(console.error).toHaveBeenCalledWith(`No key 'type' found in dataset for token ${token}`);
  });

  it('should log an error for a response without name for dataset', () => {
    validateResponse({ dataset: {} }, {}, token);
    expect(console.error).toHaveBeenCalledWith(`No key 'name' found in dataset for token ${token}`);
  });

  it('should not log an error for a status response', () => {
    validateResponse({}, { code: 1101 });
    expect(console.error).not.toHaveBeenCalledWith();
  });
  /* eslint-enable no-console */
});

describe('sanitizeSearchOptions', () => {
  it('should return `ANY` as search type if none is given', () => {
    const searchOptions = { search: 'Dodgers' };

    expect(sanitizeSearchOptions(searchOptions)).toEqual({
      search: 'Dodgers',
      searchType: SEARCH_TYPE_ANY,
    });
  });

  it('should return `ANY` as search type, if the type does not match a proper search type', () => {
    const searchOptions = { search: 'Dodgers', searchType: 'baseballTeam' };

    expect(sanitizeSearchOptions(searchOptions)).toEqual({
      search: 'Dodgers',
      searchType: SEARCH_TYPE_ANY,
    });
  });

  it('should return the given search type, if it matches a proper search type', () => {
    const searchOptionsMac = { search: 'Dodgers', searchType: SEARCH_TYPE_MAC };
    const searchOptionsAny = { search: 'Dodgers', searchType: SEARCH_TYPE_ANY };
    const searchOptionsIp = { search: 'Dodgers', searchType: SEARCH_TYPE_IP };

    expect(sanitizeSearchOptions(searchOptionsMac)).toEqual({
      search: 'Dodgers',
      searchType: SEARCH_TYPE_MAC,
    });
    expect(sanitizeSearchOptions(searchOptionsAny)).toEqual({
      search: 'Dodgers',
      searchType: SEARCH_TYPE_ANY,
    });
    expect(sanitizeSearchOptions(searchOptionsIp)).toEqual({
      search: 'Dodgers',
      searchType: SEARCH_TYPE_IP,
    });
  });
});
