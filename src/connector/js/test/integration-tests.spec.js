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

import BigNumber from 'bignumber.js';
import { Server } from 'mock-socket';

import {
  APP_DATASET_TYPE,
  CONNECTED,
  DEVICE_DATASET_TYPE,
  EOF_CODE,
  EOF,
  GET,
  PAUSE,
  PAUSED_CODE,
  RESUME,
} from '../src/constants';
import Connector from '../src/index';
import { makeToken, sanitizeOptions } from '../src/utils';

const EXACT_PATH_TYPE = 'EXACT';

const EOF_STATUS = {
  code: EOF_CODE,
};

const ERROR_STATUS = {
  code: 3,
  messages: 'error',
};

function createMessage(command, params, result, status = {}, error = undefined) {
  const token = makeToken(command, params);
  return {
    message: JSON.stringify({
      token,
      result,
      error,
      status,
    }),
    token,
  };
}

describe('subscribe', () => {
  let conn;
  let spyCallback;
  let mockServer;

  const notifBatch = {
    dataset: 'device1',
    notifications: [
      { path: 'path1', timestamp: 101000002 },
      { path: 'path2', timestamp: 102000003 },
      { path: 'path1', timestamp: 103000004 },
    ],
  };

  let notifQuery;
  let createMessageParams;

  beforeEach(() => {
    mockServer = new Server('ws://localhost:8080');
    conn = new Connector();
    jest.spyOn(global.window, 'postMessage');
    jest.spyOn(conn, 'sendMessage');
    jest.spyOn(conn.eventsEmitter, 'bind');
    jest.spyOn(conn.eventsEmitter, 'unbind');
    jest.spyOn(conn.eventsEmitter, 'emit');
    spyCallback = jest.fn();
    conn.run('ws://localhost:8080');
    notifQuery = {
      query: [{
        dataset: {
          type: DEVICE_DATASET_TYPE,
          name: 'device1',
        },
        paths: [
          {
            type: EXACT_PATH_TYPE,
            path: 'path1',
          }, {
            type: EXACT_PATH_TYPE,
            path: 'path2',
          },
        ],
      }],
    };

    createMessageParams = { query: notifQuery };
  });

  afterEach(() => {
    mockServer.stop();
    global.window.postMessage.mockRestore();
    conn.sendMessage.mockRestore();
    conn.eventsEmitter.bind.mockRestore();
    conn.eventsEmitter.unbind.mockRestore();
    conn.eventsEmitter.emit.mockRestore();
  });

  test('send message and add callback', (done) => {
    const { message, token } = createMessage(Connector.SUBSCRIBE, createMessageParams, notifBatch);

    mockServer.on('message', () => {
      mockServer.send(message);
    });

    conn.connection(() => {
      conn.subscribe(notifQuery, spyCallback);

      // Assert that all functions sending the message were called properly
      expect(conn.sendMessage)
        .toHaveBeenCalledWith(token, Connector.SUBSCRIBE, createMessageParams);
      expect(conn.eventsEmitter.bind).toHaveBeenCalledWith(token, expect.any(Function));
      expect(global.window.postMessage).not.toHaveBeenCalled();

      mockServer.stop(done);
    });
  });

  test('should trigger callback with response', (done) => {
    const { message } = createMessage(Connector.SUBSCRIBE, createMessageParams, notifBatch);

    const expectedResult = {
      dataset: 'device1',
      notifications: {
        path1: [{ path: 'path1', timestamp: 101 }, { path: 'path1', timestamp: 103 }],
        path2: [{ path: 'path2', timestamp: 102 }],
      },
    };

    mockServer.on('connection', (socket) => {
      socket.on('message', () => {
        socket.send(message);
      });
    });

    conn.connection(() => {
      conn.subscribe(notifQuery, spyCallback);

      setTimeout(() => {
        expect(spyCallback).toHaveBeenCalledWith(null, expectedResult, {});
        expect(global.window.postMessage).not.toHaveBeenCalled();

        mockServer.stop(done);
      }, 10);
    });
  });

  test(
    'should trigger callback with response for each subscribe call with the same token',
    (done) => {
      const { message } = createMessage(Connector.SUBSCRIBE, createMessageParams, notifBatch);
      const spyCallback2 = jest.fn();

      const expectedResult = {
        dataset: 'device1',
        notifications: {
          path1: [{ path: 'path1', timestamp: 101 }, { path: 'path1', timestamp: 103 }],
          path2: [{ path: 'path2', timestamp: 102 }],
        },
      };

      mockServer.on('connection', (socket) => {
        socket.on('message', () => {
          socket.send(message);
        });
      });

      conn.connection(() => {
        conn.subscribe(notifQuery, spyCallback);
        conn.subscribe(notifQuery, spyCallback2);

        setTimeout(() => {
          expect(spyCallback).toHaveBeenCalledWith(null, expectedResult, {});
          expect(spyCallback2).toHaveBeenCalledWith(null, expectedResult, {});
          expect(global.window.postMessage).not.toHaveBeenCalled();

          mockServer.stop(done);
        }, 10);
      });
    },
  );

  test('not trigger callback with incorrect token', (done) => {
    const { message } = createMessage(Connector.SUBSCRIBE, createMessageParams, notifBatch);
    notifQuery.query[0].paths.push({ type: EXACT_PATH_TYPE, name: 'path2' });

    mockServer.on('connection', (socket) => {
      socket.on('message', () => {
        socket.send(message);
      });
    });

    conn.connection(() => {
      conn.subscribe(notifQuery, spyCallback);

      setTimeout(() => {
        expect(spyCallback).not.toHaveBeenCalled();
        expect(global.window.postMessage).not.toHaveBeenCalled();

        mockServer.stop(done);
      }, 10);
    });
  });

  test('trigger callback with error', (done) => {
    const { message } =
      createMessage(Connector.SUBSCRIBE, createMessageParams, notifBatch, ERROR_STATUS, 'error');

    mockServer.on('connection', (socket) => {
      socket.on('message', () => {
        socket.send(message);
      });
    });

    conn.connection(() => {
      conn.subscribe(notifQuery, spyCallback);

      setTimeout(() => {
        expect(spyCallback).toHaveBeenCalledWith('Error: error\nOptions: {}', null, ERROR_STATUS);
        expect(global.window.postMessage).not.toHaveBeenCalled();

        mockServer.stop(done);
      }, 10);
    });
  });

  test('not trigger callback because of closed stream', (done) => {
    let ws;
    const { message } = createMessage(Connector.SUBSCRIBE, createMessageParams, notifBatch);

    mockServer.on('connection', (socket) => {
      ws = socket;
      socket.on('message', () => {
        socket.send(message);
      });
    });

    conn.connection(() => {
      const closeFn = conn.subscribe(notifQuery, spyCallback);

      setTimeout(() => {
        expect(spyCallback).toHaveBeenCalledTimes(1);
        expect(global.window.postMessage).not.toHaveBeenCalled();

        spyCallback.mockClear();
        closeFn();
        ws.send(message);

        expect(spyCallback).not.toHaveBeenCalled();

        mockServer.stop(done);
      }, 10);
    });
  });

  test('should properly close the stream', (done) => {
    const { message, token } = createMessage(Connector.SUBSCRIBE, createMessageParams, notifBatch);

    mockServer.on('connection', (socket) => {
      socket.on('message', () => {
        socket.send(message);
      });
    });

    conn.connection(() => {
      const closeFn = conn.subscribe(notifQuery, spyCallback);

      setTimeout(() => {
        const closeParams = {
          [token]: true,
        };
        const closeToken = makeToken('close', closeParams);
        expect(spyCallback).toHaveBeenCalledTimes(1);
        expect(global.window.postMessage).not.toHaveBeenCalled();

        spyCallback.mockClear();
        closeFn();

        expect(spyCallback).not.toHaveBeenCalled();
        expect(conn.sendMessage).toHaveBeenCalledWith(closeToken, 'close', closeParams);

        mockServer.stop(done);
      }, 10);
    });
  });

  test('should properly close streams by identifer', (done) => {
    const { message, token } = createMessage(Connector.SUBSCRIBE, createMessageParams, notifBatch);

    mockServer.on('connection', (socket) => {
      socket.on('message', () => {
        socket.send(message);
      });
    });

    conn.connection(() => {
      const closeFn = conn.subscribe(notifQuery, spyCallback);

      setTimeout(() => {
        const closeParams = {
          [token]: true,
        };
        const closeToken = makeToken('close', closeParams);
        expect(spyCallback).toHaveBeenCalledTimes(1);
        expect(global.window.postMessage).not.toHaveBeenCalled();

        spyCallback.mockClear();
        conn.closeStreams('close', [closeFn.identifier], spyCallback);

        expect(spyCallback).not.toHaveBeenCalled();
        expect(conn.sendMessage).toHaveBeenCalledWith(closeToken, 'close', closeParams);

        mockServer.stop(done);
      }, 10);
    });
  });

  test(
    'should only close the stream if the closed stream is the last one with the token',
    (done) => {
      const { message, token } = createMessage(
        Connector.SUBSCRIBE, createMessageParams, notifBatch,
      );
      const spyCallback2 = jest.fn();

      mockServer.on('connection', (socket) => {
        socket.on('message', () => {
          socket.send(message);
        });
      });

      conn.connection(() => {
        const closeFn = conn.subscribe(notifQuery, spyCallback);
        const closeFn2 = conn.subscribe(notifQuery, spyCallback2);

        setTimeout(() => {
          const closeParams = {
            [token]: true,
          };
          const closeToken = makeToken('close', closeParams);
          expect(spyCallback).toHaveBeenCalledTimes(1);
          expect(spyCallback2).toHaveBeenCalledTimes(1);
          expect(conn.sendMessage).toHaveBeenCalledTimes(1);
          expect(global.window.postMessage).not.toHaveBeenCalled();

          spyCallback.mockClear();
          spyCallback2.mockClear();
          conn.sendMessage.mockClear();
          // Should not yet close the stream
          closeFn2();

          expect(spyCallback).not.toHaveBeenCalled();
          expect(spyCallback2).not.toHaveBeenCalled();
          expect(conn.sendMessage).not.toHaveBeenCalled();

          // Should close the stream, it's the last open subscribe
          closeFn();

          expect(spyCallback).not.toHaveBeenCalled();
          expect(conn.sendMessage).toHaveBeenCalledWith(closeToken, 'close', closeParams);

          mockServer.stop(done);
        }, 10);
      });
    },
  );
});

describe('getWithOptions', () => {
  const closeFn = () => {};
  const query = [{
    dataset: {
      type: DEVICE_DATASET_TYPE,
      name: 'device1',
    },
    paths: [
      {
        type: EXACT_PATH_TYPE,
        path: 'path1',
      }, {
        type: EXACT_PATH_TYPE,
        path: 'path2',
      },
    ],
  }];
  const now = 1000;
  let conn;
  let spyCallback;
  const defaultParams = {
    query,
    start: undefined,
    end: now * 1e6,
    versions: undefined,
  };
  let mockServer;

  function checkRequestParams(connection, params) {
    expect(connection.get.mock.calls[0][0]).toBe(Connector.GET);
    expect(connection.get.mock.calls[0][1]).toEqual(params);
  }

  beforeEach(() => {
    mockServer = new Server('ws://localhost:8080');
    conn = new Connector();
    jest.spyOn(conn, 'sendMessage');
    jest.spyOn(conn.eventsEmitter, 'bind');
    jest.spyOn(conn.eventsEmitter, 'unbind');
    jest.spyOn(conn, 'subscribe').mockImplementation(() => closeFn);
    jest.spyOn(conn, 'get');
    spyCallback = jest.fn();
    conn.run('ws://localhost:8080');
  });

  afterEach(() => {
    mockServer.stop();
  });

  test('should correctly request the most recent value', () => {
    conn.getWithOptions(query, spyCallback, {});

    checkRequestParams(conn, { ...defaultParams, end: undefined });
  });

  test('should correctly request a defined time interval', () => {
    const options = {
      start: 1000,
      end: 2000,
    };
    conn.getWithOptions(query, spyCallback, options);

    checkRequestParams(conn, {
      ...defaultParams,
      start: options.start * 1e6,
      end: options.end * 1e6,
    });
  });

  test('should correctly request with no options', () => {
    conn.getWithOptions(query, spyCallback);

    checkRequestParams(conn, {
      ...defaultParams,
      end: undefined,
    });
  });

  test(
    'should correctly request a defined time interval, given only start',
    () => {
      const options = {
        start: 1000,
      };
      conn.getWithOptions(query, spyCallback, options);

      checkRequestParams(conn, {
        ...defaultParams,
        start: options.start * 1e6,
        end: undefined,
      });
    },
  );

  test('should correctly request versions given end and versions', () => {
    const options = {
      versions: 10,
      end: 2000,
    };
    conn.getWithOptions(query, spyCallback, options);

    checkRequestParams(conn, {
      ...defaultParams,
      versions: 10,
      end: options.end * 1e6,
    });
  });

  test('should correctly request versions given versions', () => {
    const options = {
      versions: 10,
    };
    conn.getWithOptions(query, spyCallback, options);

    checkRequestParams(conn, {
      ...defaultParams,
      end: undefined,
      versions: 10,
    });
  });

  test('should not make request for start and versions', () => {
    const options = {
      versions: 10,
      start: 2000,
    };
    conn.getWithOptions(query, spyCallback, options);

    expect(conn.get).not.toHaveBeenCalled();
  });

  test('should not make request for start, end and versions', () => {
    const options = {
      versions: 10,
      start: 1000,
      end: 2000,
    };
    conn.getWithOptions(query, spyCallback, options);

    expect(conn.get).not.toHaveBeenCalled();
  });

  test('should not make request if start > end', () => {
    const options = {
      start: 2000,
      end: 1000,
    };
    conn.getWithOptions(query, spyCallback, options);

    expect(conn.get).not.toHaveBeenCalled();
  });
});

describe('JSON Parse', () => {
  let conn;
  let spyCallback;
  let fecIdBig;
  let fecIdSmall;
  let mockServer;

  beforeEach(() => {
    mockServer = new Server('ws://localhost:8080');
    fecIdBig = new BigNumber('72057598332895322');
    fecIdSmall = new BigNumber(200);
    conn = new Connector();
    jest.spyOn(conn, 'sendMessage');
    jest.spyOn(conn.eventsEmitter, 'bind');
    jest.spyOn(conn.eventsEmitter, 'unbind');
    spyCallback = jest.fn();
    conn.run('ws://localhost:8080');
  });

  afterEach(() => {
    mockServer.stop();
  });

  test('parses integers as standard JSON', (done) => {
    const query = [{
      dataset: {
        type: DEVICE_DATASET_TYPE,
        name: 'device1',
      },
      paths: [{
        type: EXACT_PATH_TYPE,
        path: 'path1',
      }],
    }];
    spyCallback.simple = true;

    const msg = '{"token":"' + makeToken(Connector.SUBSCRIBE, { query })
      + '","result":{"dataset":"device1","notifications":'
      + '[{"path":"path1","timestamp":1500000000000000000,"updates":'
      + '{"fecIdSmall":200, "fecIdBig":72057598332895322}}]}}';

    mockServer.on('connection', (socket) => {
      socket.on('message', () => {
        socket.send(msg);
      });
    });

    conn.connection(() => {
      conn.subscribe(query, spyCallback);

      setTimeout(() => {
        expect(spyCallback).toHaveBeenCalledWith(null, {
          dataset: 'device1',
          notifications: {
            path1: [{
              path: 'path1',
              timestamp: 1500000000000,
              updates: { fecIdSmall: 200, fecIdBig: 72057598332895322 },
            }],
          },
        }, undefined);

        mockServer.stop(done);
      }, 10);
    });
  });

  test('parses integers as BigNumber', (done) => {
    const query = [{
      dataset: {
        type: DEVICE_DATASET_TYPE,
        name: 'device1',
      },
      paths: [{
        type: EXACT_PATH_TYPE,
        path: 'path1',
      }],
    }];
    spyCallback.simple = false;
    // the first fecId is a number beyond the max 2^53 handled without precision loss in javascript
    // parsing with JSONBigNumber should convert to BigNumber without precision loss
    const msg = '{"token":"' + makeToken(Connector.SUBSCRIBE, { query })
      + '","result":{"dataset":"device1","notifications":'
      + '[{"path":"path1","timestamp":1500000000000000000,"updates":'
      + '{"fecIdSmall":200, "fecIdBig":72057598332895322}}]}}';

    mockServer.on('connection', (socket) => {
      socket.on('message', () => {
        socket.send(msg);
      });
    });

    conn.connection(() => {
      conn.subscribe(query, spyCallback);

      setTimeout(() => {
        expect(spyCallback).toHaveBeenCalledWith(null, {
          dataset: 'device1',
          notifications: {
            path1: [{ path: 'path1', timestamp: 1500000000000, updates: { fecIdSmall, fecIdBig } }],
          },
        }, undefined);

        mockServer.stop(done);
      }, 10);
    });
  });
});

describe('request-response', () => {
  let conn;
  let spyCallback;
  let mockServer;
  const query = [{
    dataset: {
      type: DEVICE_DATASET_TYPE,
      name: 'device1',
    },
    paths: [
      {
        type: EXACT_PATH_TYPE,
        path: 'path1',
      }, {
        type: EXACT_PATH_TYPE,
        path: 'path2',
      },
    ],
  }];

  const notif = {
    dataset: 'device1',
    notifications: [
      { path: 'path1', timestamp: 1476750400000124999 },
      { path: 'path2', timestamp: 1500000000000000001 },
      { path: 'path1', timestamp: 1600000000000000001 },
    ],
  };

  const packedNotifs = {
    dataset: 'device1',
    notifications: {
      path1: [
        { path: 'path1', timestamp: 1476750400000 },
        { path: 'path1', timestamp: 1600000000000 },
      ],
      path2: [{ path: 'path2', timestamp: 1500000000000 }],
    },
  };

  const notif2 = {
    dataset: 'device1',
    notifications: [
      { path: 'path1', timestamp: 1476750400000124999 },
      { path: 'path2', timestamp: 1500000000000000001 },
      { path: 'path1', timestamp: 1600000000000000001 },
      { path: 'path3', timestamp: 2600000000000000001 },
    ],
  };

  const packedNotifs2 = {
    dataset: 'device1',
    notifications: {
      path1: [
        { path: 'path1', timestamp: 1476750400000 },
        { path: 'path1', timestamp: 1600000000000 },
      ],
      path2: [{ path: 'path2', timestamp: 1500000000000 }],
      path3: [{ path: 'path3', timestamp: 2600000000000 }],
    },
  };

  beforeEach(() => {
    mockServer = new Server('ws://localhost:8080');
    conn = new Connector();
    jest.spyOn(conn, 'sendMessage');
    jest.spyOn(conn.eventsEmitter, 'bind');
    jest.spyOn(conn.eventsEmitter, 'unbind');
    jest.spyOn(conn.eventsEmitter, 'emit');
    jest.spyOn(global.window, 'postMessage');
    spyCallback = jest.fn();
    conn.run('ws://localhost:8080');
  });

  afterEach(() => {
    mockServer.stop();
    global.window.postMessage.mockRestore();
    conn.sendMessage.mockRestore();
    conn.eventsEmitter.bind.mockRestore();
    conn.eventsEmitter.unbind.mockRestore();
    conn.eventsEmitter.emit.mockRestore();
  });

  test('should successfully perform for getDatasets', (done) => {
    let ws;
    const getDatasetParams = { types: [APP_DATASET_TYPE, DEVICE_DATASET_TYPE] };
    const datasetsMessage = {
      datasets: [
        { type: DEVICE_DATASET_TYPE, name: 'device1' },
        { type: DEVICE_DATASET_TYPE, name: 'device2' },
        { type: APP_DATASET_TYPE, name: 'app1' },
      ],
    };
    const { message, token } = createMessage(
      Connector.GET_DATASETS, getDatasetParams, datasetsMessage,
    );
    const { message: eofMessage } = createMessage(
      Connector.GET_DATASETS, getDatasetParams, null, EOF_STATUS, EOF,
    );

    mockServer.on('connection', (socket) => {
      ws = socket;
      socket.on('message', () => {
        socket.send(message);
      });
    });

    conn.connection(() => {
      conn.getDatasets(spyCallback);

      // Asset that all functions sending the message were called properly
      expect(conn.sendMessage)
        .toHaveBeenCalledWith(
          token, Connector.GET_DATASETS,
          getDatasetParams,
        );
      expect(global.window.postMessage).not.toHaveBeenCalled();
      expect(conn.eventsEmitter.bind).toHaveBeenCalledWith(token, expect.any(Function));

      setTimeout(() => {
        expect(spyCallback).toHaveBeenCalledTimes(1);
        expect(spyCallback).toHaveBeenCalledWith(null, datasetsMessage, {});

        // Send EOF message (all devices sent)
        spyCallback.mockClear();
        ws.send(eofMessage);
        expect(conn.eventsEmitter.unbind).toHaveBeenCalledTimes(1);
        expect(conn.eventsEmitter.emit).toHaveBeenCalledWith(token, EOF, null, EOF_STATUS);
        expect(spyCallback).toHaveBeenCalledTimes(1);
        expect(spyCallback).toHaveBeenCalledWith(null, null, EOF_STATUS);

        // Resend the messgae (should not trigger callback since it is unbound)
        spyCallback.mockClear();
        ws.send(message);

        expect(spyCallback).not.toHaveBeenCalled();

        mockServer.stop(done);
      }, 10);
    });
  });

  test('should correctly perform for getWithOptions', (done) => {
    let ws;
    const options = sanitizeOptions({
      start: 147675040000,
      end: 1600000000000,
    });
    const createMessageParams = { query, ...options };
    const { message, token } = createMessage(Connector.GET, createMessageParams, notif);
    const { message: eofMessage } = createMessage(
      Connector.GET, createMessageParams, null, EOF_STATUS, EOF,
    );

    mockServer.on('connection', (socket) => {
      ws = socket;
      socket.on('message', () => {
        socket.send(message);
      });
    });

    conn.connection(() => {
      conn.getWithOptions(query, spyCallback, options);

      setTimeout(() => {
        expect(spyCallback).toHaveBeenCalledWith(null, packedNotifs, {});
        expect(global.window.postMessage).not.toHaveBeenCalled();

        // Send EOF message
        spyCallback.mockClear();
        ws.send(eofMessage);
        expect(conn.eventsEmitter.unbind).toHaveBeenCalledTimes(1);
        expect(conn.eventsEmitter.emit).toHaveBeenCalledWith(token, EOF, null, EOF_STATUS);
        expect(spyCallback).toHaveBeenCalledTimes(1);
        expect(spyCallback).toHaveBeenCalledWith(null, null, EOF_STATUS);

        // server sends a message again, should have removed callback
        spyCallback.mockClear();
        conn.eventsEmitter.unbind.mockClear();
        ws.send(message);
        expect(spyCallback).not.toHaveBeenCalledWith(null, packedNotifs);
        expect(spyCallback).not.toHaveBeenCalled();

        mockServer.stop(done);
      }, 10);
    });
  });

  test(
    'should correctly perform for getWithOptions for simultaneous requests with the same token',
    (done) => {
      let ws;
      const options = sanitizeOptions({
        start: 147675040000,
        end: 1600000000000,
      });
      const createMessageParams = { query, ...options };
      const { message, token } = createMessage(Connector.GET, createMessageParams, notif);
      const { message: eofMessage } = createMessage(
        Connector.GET, createMessageParams, null, EOF_STATUS, EOF,
      );
      const {
        message: message2,
        token: token2,
      } = createMessage(Connector.GET, createMessageParams, notif2);
      const spyCallback2 = jest.fn();

      mockServer.on('connection', (socket) => {
        ws = socket;
        socket.on('message', () => {
          socket.send(message);
        });
      });

      conn.connection(() => {
        conn.getWithOptions(query, spyCallback, options);

        setTimeout(() => {
          expect(spyCallback).toHaveBeenCalledWith(null, packedNotifs, {});
          expect(global.window.postMessage).not.toHaveBeenCalled();

          // Should get previously sent message immedialty
          conn.getWithOptions(query, spyCallback2, options);
          expect(spyCallback2).toHaveBeenCalledTimes(1);
          expect(spyCallback2).toHaveBeenCalledWith(null, packedNotifs, {});

          // Send another message
          spyCallback.mockClear();
          spyCallback2.mockClear();
          ws.send(message2);
          expect(token).toBe(token2);
          expect(spyCallback).toHaveBeenCalledWith(null, packedNotifs2, {});
          expect(spyCallback2).toHaveBeenCalledWith(null, packedNotifs2, {});

          // Send EOF message
          spyCallback.mockClear();
          spyCallback2.mockClear();
          ws.send(eofMessage);
          expect(conn.eventsEmitter.unbind).toHaveBeenCalledTimes(2);
          expect(conn.eventsEmitter.emit).toHaveBeenCalledWith(token, EOF, null, EOF_STATUS);
          expect(conn.frameCache.get(token)).toBe(undefined);
          expect(spyCallback).toHaveBeenCalledTimes(1);
          expect(spyCallback2).toHaveBeenCalledTimes(1);
          expect(spyCallback).toHaveBeenCalledWith(null, null, EOF_STATUS);
          expect(spyCallback2).toHaveBeenCalledWith(null, null, EOF_STATUS);

          // server sends a message again, should have removed callback
          spyCallback.mockClear();
          spyCallback2.mockClear();
          conn.eventsEmitter.unbind.mockClear();
          ws.send(message);
          expect(spyCallback).not.toHaveBeenCalledWith(null, packedNotifs, {});
          expect(spyCallback2).not.toHaveBeenCalledWith(null, packedNotifs, {});
          expect(spyCallback).not.toHaveBeenCalled();
          expect(spyCallback2).not.toHaveBeenCalled();

          mockServer.stop(done);
        }, 10);
      });
    },
  );
});

describe('pauseAndResume', () => {
  const url = 'ws://localhost:8080';
  let conn;
  let mockServer;

  beforeEach(() => {
    mockServer = new Server(url);
    conn = new Connector({ pauseStreams: true });
    jest.spyOn(conn, 'resume');
    jest.spyOn(conn, 'sendMessage');
    jest.spyOn(conn, 'pause');
    jest.spyOn(conn.connectionEvents, 'emit');
    jest.spyOn(console, 'error');
  });

  afterEach(() => {
    mockServer.stop();
    conn.resume.mockRestore();
    conn.pause.mockRestore();
    conn.sendMessage.mockRestore();
    conn.connectionEvents.emit.mockRestore();
    console.error.mockRestore(); // eslint-disable-line no-console
  });

  test('pause sends message and triggers callback on success', (done) => {
    conn.run(url);
    const params = { pauseStreams: true };
    const token = makeToken(PAUSE, params);
    const { message: eofMessage } = createMessage(
      PAUSE, params, null, EOF_STATUS, EOF,
    );

    mockServer.on('connection', (socket) => {
      socket.on('message', () => {
        socket.send(eofMessage);
      });
    });

    conn.connection(() => {
      expect(conn.sendMessage).toHaveBeenCalledWith(token, PAUSE, params);
      expect(console.error).not.toHaveBeenCalled(); // eslint-disable-line no-console
      expect(conn.connectionEvents.emit)
        .toHaveBeenCalledWith('connection', CONNECTED, expect.any(Object));

      mockServer.stop(done);
    });
  });

  test('pause sends message and triggers callback on failure', (done) => {
    conn.run(url);
    const params = { pauseStreams: true };
    const token = makeToken(PAUSE, params);
    const { message: errorMessage } = createMessage(
      PAUSE, params, null, ERROR_STATUS, 'error',
    );

    mockServer.on('connection', (socket) => {
      socket.on('message', () => {
        socket.send(errorMessage);
      });
    });

    conn.connection(() => {
      expect(conn.sendMessage).toHaveBeenCalledWith(token, PAUSE, params);
      expect(console.error).toHaveBeenCalled(); // eslint-disable-line no-console
      expect(conn.connectionEvents.emit)
        .toHaveBeenCalledWith('connection', CONNECTED, expect.any(Object));

      mockServer.stop(done);
    });
  });

  test('does not send pause, if not enabled', (done) => {
    const callbackSpy = jest.fn();
    conn.connectorOptions.pauseStreams = false;
    conn.run(url);
    const { message, token } = createMessage(GET, {}, {});

    mockServer.on('connection', (socket) => {
      socket.on('message', () => {
        socket.send(message);
      });
    });

    conn.connection(() => {
      expect(conn.pause).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled(); // eslint-disable-line no-console
      expect(conn.connectionEvents.emit)
        .toHaveBeenCalledWith('connection', CONNECTED, expect.any(Object));

      conn.get(GET, {}, callbackSpy);

      setTimeout(() => {
        expect(callbackSpy).toHaveBeenCalled();
        expect(conn.sendMessage).toHaveBeenCalledWith(token, GET, {});
        mockServer.stop(done);
      }, 100);
    });
  });

  test('should autoresume', (done) => {
    conn.run(url);
    const params = { pauseStreams: true };
    const requestCmd = GET;
    const { message: result, token: requestToken } = createMessage(requestCmd, {}, {});
    const pausedStatus = { code: PAUSED_CODE, messages: '' };
    const pausedMsg = JSON.stringify({ token: requestToken, status: pausedStatus });
    const resumeParams = { token: requestToken };
    const resumeToken = makeToken(RESUME, resumeParams);
    const pasueToken = makeToken(PAUSE, params);
    const { message: enablePauseMessage } = createMessage(
      PAUSE, params, null, EOF_STATUS, EOF,
    );

    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        const msg = JSON.parse(data);
        if (msg.command === requestCmd) {
          socket.send(result);
          socket.send(pausedMsg);
        } else if (msg.command === PAUSE) {
          socket.send(enablePauseMessage);
        }
      });
    });

    conn.connection(() => {
      conn.sendMessage(requestToken, requestCmd, {});

      setTimeout(() => {
        expect(conn.sendMessage).toHaveBeenCalledTimes(3);
        expect(conn.sendMessage).toHaveBeenNthCalledWith(1, pasueToken, PAUSE, params);
        expect(conn.sendMessage).toHaveBeenNthCalledWith(2, requestToken, requestCmd, {});
        expect(conn.sendMessage).toHaveBeenNthCalledWith(3, resumeToken, RESUME, resumeParams);
        expect(conn.resume).toHaveBeenCalledTimes(1);
        expect(conn.resume).toHaveBeenCalledWith(requestToken);

        mockServer.stop(done);
      }, 10);
    });
  });
});
