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
  CLOSE,
  EOF,
  EOF_CODE,
  ERROR,
  GET,
  GET_DATASETS,
  ID,
  PAUSE,
  PAUSED_CODE,
  PUBLISH,
  RESUME,
  SEARCH,
  SEARCH_SUBSCRIBE,
  SERVICE_REQUEST,
  SUBSCRIBE,
} from '../src/constants';
import { log } from '../src/logger';
import Parser from '../src/parser';
import { makeToken } from '../src/utils';
import WRPC from '../src/wrpc';
import { NotifCallback, SubscriptionIdentifier } from '../types';
import { WsCommand, CloudVisionParams } from '../types/params';
import { CloudVisionQueryMessage } from '../types/query';

const query = { query: [] };

jest.mock('../src/parser', () => ({
  parse: (res: string) => JSON.parse(res),
  stringify: (msg: CloudVisionQueryMessage) => JSON.stringify(msg),
}));

jest.mock('../src/logger', () => {
  return { log: jest.fn() };
});

jest.spyOn(console, 'groupCollapsed').mockImplementation();

const stringifyMessage = (msg: object) => JSON.stringify(msg);

describe('open/close/connection', () => {
  let wrpc: WRPC;
  let ws: WebSocket;
  let eventsEmitterSpy: jest.SpyInstance;
  let eventsEmitterUnbindSpy: jest.SpyInstance;
  let eventsEmitterBindSpy: jest.SpyInstance;
  let eventsEmitterCloseSpy: jest.SpyInstance;
  let connectionEmitterCloseSpy: jest.SpyInstance;
  let connectionEmitterSpy: jest.SpyInstance;
  let connectionEmitterUnbindSpy: jest.SpyInstance;
  let activeStreamsClearSpy: jest.SpyInstance;
  let onCloseSpy: jest.SpyInstance;
  const connectionSpy = jest.fn();

  beforeEach(() => {
    wrpc = new WRPC();
    wrpc.run('ws://localhost:8080');
    ws = wrpc.websocket;
    connectionSpy.mockClear();
    onCloseSpy = jest.spyOn(ws, 'close');
    eventsEmitterSpy = jest.spyOn(wrpc.eventsEmitter, 'emit');
    eventsEmitterBindSpy = jest.spyOn(wrpc.eventsEmitter, 'bind');
    eventsEmitterUnbindSpy = jest.spyOn(wrpc.eventsEmitter, 'unbind');
    eventsEmitterCloseSpy = jest.spyOn(wrpc.eventsEmitter, 'close');
    connectionEmitterCloseSpy = jest.spyOn(wrpc.connectionEmitter, 'close');
    connectionEmitterSpy = jest.spyOn(wrpc.connectionEmitter, 'emit');
    connectionEmitterUnbindSpy = jest.spyOn(wrpc.connectionEmitter, 'unbind');
    // @ts-ignore
    activeStreamsClearSpy = jest.spyOn(wrpc.activeStreams, 'clear');
  });

  test('should set isRunning and emit connection event on WS open messages', () => {
    wrpc.connection(connectionSpy);
    ws.dispatchEvent(new MessageEvent('open', {}));

    expect(connectionEmitterSpy).toHaveBeenCalledTimes(1);
    expect(connectionEmitterUnbindSpy).not.toHaveBeenCalled();
    expect(eventsEmitterSpy).not.toHaveBeenCalled();
    expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
    expect(eventsEmitterBindSpy).not.toHaveBeenCalled();
    expect(wrpc.isRunning).toBe(true);
    expect(connectionSpy).toHaveBeenCalledTimes(1);
    expect(connectionSpy).toHaveBeenCalledWith(WRPC.CONNECTED, expect.any(Event));
  });

  test('should not re emit connection event on subsequent WS open messages', () => {
    wrpc.connection(connectionSpy);
    ws.dispatchEvent(new MessageEvent('open', {}));
    ws.dispatchEvent(new MessageEvent('open', {}));

    expect(connectionEmitterSpy).toHaveBeenCalledTimes(1);
    expect(connectionEmitterUnbindSpy).not.toHaveBeenCalled();
    expect(eventsEmitterSpy).not.toHaveBeenCalled();
    expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
    expect(eventsEmitterBindSpy).not.toHaveBeenCalled();
    expect(wrpc.isRunning).toBe(true);
    expect(connectionSpy).toHaveBeenCalledTimes(1);
    expect(connectionSpy).toHaveBeenCalledWith(WRPC.CONNECTED, expect.any(Event));
  });

  test('should close emitters and call close WS on close call and emit disconnection event', () => {
    wrpc.connection(connectionSpy);
    ws.dispatchEvent(new MessageEvent('open', {}));
    connectionEmitterSpy.mockClear();
    connectionSpy.mockClear();

    wrpc.close();

    expect(onCloseSpy).toHaveBeenCalledTimes(1);
    expect(eventsEmitterCloseSpy).toHaveBeenCalledTimes(1);
    expect(connectionEmitterCloseSpy).toHaveBeenCalledTimes(1);
    expect(connectionEmitterSpy).toHaveBeenCalledTimes(1);
    expect(connectionEmitterSpy).toHaveBeenCalledWith(
      'connection',
      WRPC.DISCONNECTED,
      expect.any(CloseEvent),
    );
    expect(connectionEmitterUnbindSpy).not.toHaveBeenCalled();
    expect(eventsEmitterSpy).not.toHaveBeenCalled();
    expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
    expect(eventsEmitterBindSpy).not.toHaveBeenCalled();
    expect(wrpc.connectionEmitter.getEventsMap().size).toBe(0);
    expect(wrpc.eventsEmitter.getEventsMap().size).toBe(0);
    expect(wrpc.isRunning).toBe(false);
    expect(connectionSpy).toHaveBeenCalledTimes(1);
    expect(connectionSpy).toHaveBeenCalledWith(WRPC.DISCONNECTED, expect.any(CloseEvent));
  });

  test('should emit close event on WS close message and emit disconnection event', () => {
    wrpc.connection(connectionSpy);
    ws.dispatchEvent(new MessageEvent('open', {}));
    connectionEmitterSpy.mockClear();
    connectionSpy.mockClear();

    ws.dispatchEvent(new CloseEvent('close', {}));

    expect(wrpc.isRunning).toBe(false);
    expect(eventsEmitterCloseSpy).toHaveBeenCalledTimes(1);
    expect(activeStreamsClearSpy).toHaveBeenCalledTimes(1);
    expect(connectionEmitterCloseSpy).not.toHaveBeenCalled();
    expect(onCloseSpy).not.toHaveBeenCalled();
    expect(connectionEmitterSpy).toHaveBeenCalledTimes(1);
    expect(connectionEmitterSpy).toHaveBeenCalledWith(
      'connection',
      WRPC.DISCONNECTED,
      expect.any(CloseEvent),
    );
    expect(connectionSpy).toHaveBeenCalledTimes(1);
    expect(connectionSpy).toHaveBeenCalledWith(WRPC.DISCONNECTED, expect.any(CloseEvent));
  });

  test('should unbind connection event callback', () => {
    const connectionEventCallback = wrpc.connection(connectionSpy);
    ws.dispatchEvent(new MessageEvent('open', {}));
    connectionEmitterSpy.mockClear();
    connectionSpy.mockClear();
    connectionEventCallback();

    expect(connectionEmitterUnbindSpy).toHaveBeenCalledTimes(1);
    expect(connectionEmitterSpy).not.toHaveBeenCalled();
    expect(eventsEmitterSpy).not.toHaveBeenCalled();
    expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
    expect(eventsEmitterBindSpy).not.toHaveBeenCalled();
    expect(wrpc.isRunning).toBe(true);
    expect(connectionSpy).not.toHaveBeenCalled();
  });
});

describe.each([
  [GET_DATASETS, 'get', true],
  [GET, 'get', true],
  [PUBLISH, 'publish', false],
  [SEARCH, 'search', false],
  [SERVICE_REQUEST, 'requestService', false],
  [RESUME, 'resume', false],
  [PAUSE, 'pause', false],
])('Call Commands', (command, fn, polymorphic) => {
  const wsCommand = command as WsCommand;
  let wrpc: WRPC;
  let ws: WebSocket;
  let sendSpy: jest.SpyInstance;
  let eventsEmitterSpy: jest.SpyInstance;
  let eventsEmitterUnbindSpy: jest.SpyInstance;
  let eventsEmitterBindSpy: jest.SpyInstance;
  let polymorphicCommandFn: (
    c: WsCommand,
    p: CloudVisionParams,
    cb: NotifCallback,
  ) => string | null;
  let commandFn: (p: CloudVisionParams, cb: NotifCallback) => string | null;
  const callbackSpy = jest.fn();
  const ERROR_MESSAGE = 'error';
  const ERROR_STATUS = {
    code: 3,
    messages: ERROR_MESSAGE,
  };
  const RESULT = { dataset: 'Dodgers' };

  beforeEach(() => {
    jest.resetAllMocks();
    wrpc = new WRPC();
    // @ts-ignore
    commandFn = wrpc[fn];
    // @ts-ignore
    polymorphicCommandFn = wrpc[fn];
    wrpc.run('ws://localhost:8080');
    ws = wrpc.websocket;
    sendSpy = jest.spyOn(ws, 'send');
    eventsEmitterSpy = jest.spyOn(wrpc.eventsEmitter, 'emit');
    eventsEmitterBindSpy = jest.spyOn(wrpc.eventsEmitter, 'bind');
    eventsEmitterUnbindSpy = jest.spyOn(wrpc.eventsEmitter, 'unbind');
  });

  afterEach(() => {
    sendSpy.mockClear();
    eventsEmitterSpy.mockClear();
    eventsEmitterBindSpy.mockClear();
    eventsEmitterUnbindSpy.mockClear();
    callbackSpy.mockClear();
  });

  test(`'${fn} + ${wsCommand}' should not send message if socket is not running`, () => {
    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, wsCommand, {}, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }

    expect(callbackSpy).toHaveBeenCalledWith('Connection is down');
    expect(eventsEmitterSpy).not.toHaveBeenCalled();
    expect(eventsEmitterBindSpy).not.toHaveBeenCalled();
    expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
    expect(token).toBe(null);
  });

  test(`'${fn} + ${wsCommand}' should send message if socket is running`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, wsCommand, {}, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    if (token) {
      expect(callbackSpy).not.toHaveBeenCalled();
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(
        Parser.stringify({
          token,
          command: wsCommand,
          params: {},
        }),
      );
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${wsCommand}' call callback with error on message that throws a send error`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));
    sendSpy.mockImplementation(() => {
      throw ERROR_MESSAGE;
    });

    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, wsCommand, {}, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    if (token) {
      expect(log).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(
        Parser.stringify({
          token,
          command: wsCommand,
          params: {},
        }),
      );
      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(ERROR_MESSAGE, undefined, undefined, token);
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${wsCommand}' should call callback and unbind on all errors`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, wsCommand, {}, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    if (token) {
      ws.dispatchEvent(
        new MessageEvent('message', {
          data: stringifyMessage({ token, error: ERROR_MESSAGE, status: ERROR_STATUS }),
        }),
      );

      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(ERROR_MESSAGE, undefined, ERROR_STATUS, token);
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterSpy).toHaveBeenCalledWith(token, ERROR_MESSAGE, undefined, ERROR_STATUS);
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${wsCommand}' should call callback and unbind on all EOF`, () => {
    const EOF_STATUS = { code: EOF_CODE };
    ws.dispatchEvent(new MessageEvent('open', {}));

    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, wsCommand, {}, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    if (token) {
      ws.dispatchEvent(
        new MessageEvent('message', {
          data: stringifyMessage({ token, error: EOF, status: EOF_STATUS }),
        }),
      );

      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(EOF, undefined, EOF_STATUS, token);
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterSpy).toHaveBeenCalledWith(token, EOF, undefined, EOF_STATUS);
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${wsCommand}' should call callback on message and not unbind`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, wsCommand, {}, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    if (token) {
      ws.dispatchEvent(
        new MessageEvent('message', { data: stringifyMessage({ token, result: RESULT }) }),
      );

      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(null, RESULT, undefined, token);
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterSpy).toHaveBeenCalledWith(token, null, RESULT, undefined);
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${wsCommand}' should not call callback on message that is not a string`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, wsCommand, {}, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    if (token) {
      ws.dispatchEvent(new MessageEvent('message', { data: RESULT }));

      expect(callbackSpy).not.toHaveBeenCalled();
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${wsCommand}' should not call callback on message without token`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, wsCommand, {}, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    if (token) {
      ws.dispatchEvent(new MessageEvent('message', { data: stringifyMessage({ result: RESULT }) }));

      expect(callbackSpy).not.toHaveBeenCalled();
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${wsCommand}' should not call callback on message that throws error`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const result = '{ data: 1';
    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, wsCommand, {}, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    if (token) {
      ws.dispatchEvent(new MessageEvent('message', { data: result }));

      expect(log).toHaveBeenCalledTimes(1);
      expect(callbackSpy).not.toHaveBeenCalled();
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });
});

describe.each([
  [GET_DATASETS, 'get', true],
  [GET, 'get', true],
  [PUBLISH, 'publish', false],
  [SEARCH, 'search', false],
  [SERVICE_REQUEST, 'requestService', false],
  [RESUME, 'resume', false],
  [PAUSE, 'pause', false],
])('Call Commands in debug mode', (command, fn, polymorphic) => {
  const wsCommand = command as WsCommand;
  let NOW = 0;
  let wrpc: WRPC;
  let ws: WebSocket;
  let sendSpy: jest.SpyInstance;
  let postMessageSpy: jest.SpyInstance;
  let eventsEmitterSpy: jest.SpyInstance;
  let eventsEmitterUnbindSpy: jest.SpyInstance;
  let eventsEmitterBindSpy: jest.SpyInstance;
  let commandFn: (p: CloudVisionParams, cb: NotifCallback) => string | null;
  let polymorphicCommandFn: (
    c: WsCommand,
    p: CloudVisionParams,
    cb: NotifCallback,
  ) => string | null;
  const callbackSpy = jest.fn();
  const ERROR_MESSAGE = 'error';
  const ERROR_STATUS = {
    code: 3,
    messages: ERROR_MESSAGE,
  };
  const RESULT = { dataset: 'Dodgers' };

  beforeEach(() => {
    jest.resetAllMocks();
    NOW = Date.now();
    Date.now = jest.fn(() => NOW);
    wrpc = new WRPC({
      pauseStreams: false,
      batchResults: true,
      debugMode: true,
    });
    // @ts-ignore
    commandFn = wrpc[fn];
    // @ts-ignore
    polymorphicCommandFn = wrpc[fn];
    wrpc.run('ws://localhost:8080');
    ws = wrpc.websocket;
    sendSpy = jest.spyOn(ws, 'send');
    postMessageSpy = jest.spyOn(global.window, 'postMessage');
    eventsEmitterSpy = jest.spyOn(wrpc.eventsEmitter, 'emit');
    eventsEmitterBindSpy = jest.spyOn(wrpc.eventsEmitter, 'bind');
    eventsEmitterUnbindSpy = jest.spyOn(wrpc.eventsEmitter, 'unbind');
  });

  afterEach(() => {
    sendSpy.mockClear();
    postMessageSpy.mockClear();
    eventsEmitterSpy.mockClear();
    eventsEmitterBindSpy.mockClear();
    eventsEmitterUnbindSpy.mockClear();
    callbackSpy.mockClear();
  });

  test(`'${fn} + ${wsCommand}' should send message and 'postMessage' to window`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const params = {};
    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, wsCommand, params, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    const expectedMessage = {
      token,
      command,
      params,
    };
    const expectedPostedMessage = { request: expectedMessage, source: ID, timestamp: NOW };

    if (token) {
      expect(postMessageSpy).toHaveBeenCalledWith(expectedPostedMessage, '*');
      expect(callbackSpy).not.toHaveBeenCalled();
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(
        Parser.stringify({
          token,
          command: wsCommand,
          params: {},
        }),
      );
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${wsCommand}' should call callback and 'postMessage' to window on message`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const params = {};
    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, wsCommand, params, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    const expectedPostedMessage = {
      response: { token, result: RESULT },
      source: ID,
      timestamp: NOW,
    };

    if (token) {
      postMessageSpy.mockClear();
      ws.dispatchEvent(
        new MessageEvent('message', { data: stringifyMessage({ token, result: RESULT }) }),
      );

      expect(postMessageSpy).toHaveBeenCalledTimes(1);
      expect(postMessageSpy).toHaveBeenCalledWith(expectedPostedMessage, '*');
      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(null, RESULT, undefined, token);
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${wsCommand}' should send message and 'postMessage' to window only once`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const params = {};
    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, wsCommand, params, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    const expectedMessage = {
      token,
      command,
      params,
    };
    const expectedPostedMessage = { request: expectedMessage, source: ID, timestamp: NOW };

    // second call
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, wsCommand, params, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }

    if (token) {
      expect(postMessageSpy).toHaveBeenCalledWith(expectedPostedMessage, '*');
      expect(callbackSpy).not.toHaveBeenCalled();
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(2);
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(
        Parser.stringify({
          token,
          command: wsCommand,
          params: {},
        }),
      );
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${wsCommand}' should call callback and 'postMessage' to window on message only once for multiple callbacks`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const params = {};
    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, wsCommand, params, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    const expectedPostedMessage = {
      response: { token, result: RESULT },
      source: ID,
      timestamp: NOW,
    };

    // second call
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, wsCommand, params, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }

    if (token) {
      postMessageSpy.mockClear();
      ws.dispatchEvent(
        new MessageEvent('message', { data: stringifyMessage({ token, result: RESULT }) }),
      );

      expect(postMessageSpy).toHaveBeenCalledTimes(1);
      expect(postMessageSpy).toHaveBeenCalledWith(expectedPostedMessage, '*');
      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(null, RESULT, undefined, token);
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(2);
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${wsCommand}' should call callback and 'postMessage' to window with error on error message`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const params = {};
    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, wsCommand, params, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    const expectedPostedMessage = {
      response: { token, error: ERROR_MESSAGE, status: ERROR_STATUS },
      source: ID,
      timestamp: NOW,
    };

    if (token) {
      postMessageSpy.mockClear();
      ws.dispatchEvent(
        new MessageEvent('message', {
          data: stringifyMessage({ token, error: ERROR_MESSAGE, status: ERROR_STATUS }),
        }),
      );

      expect(postMessageSpy).toHaveBeenCalledTimes(1);
      expect(postMessageSpy).toHaveBeenCalledWith(expectedPostedMessage, '*');
      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(ERROR_MESSAGE, undefined, ERROR_STATUS, token);
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${wsCommand}' should call callback and 'postMessage' to window with error on error message for each callback`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const params = {};
    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, wsCommand, params, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    const expectedPostedMessage = {
      response: { token, error: ERROR_MESSAGE, status: ERROR_STATUS },
      source: ID,
      timestamp: NOW,
    };

    // second call
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, wsCommand, params, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }

    if (token) {
      postMessageSpy.mockClear();
      ws.dispatchEvent(
        new MessageEvent('message', {
          data: stringifyMessage({ token, error: ERROR_MESSAGE, status: ERROR_STATUS }),
        }),
      );

      expect(postMessageSpy).toHaveBeenCalledTimes(1);
      expect(postMessageSpy).toHaveBeenCalledWith(expectedPostedMessage, '*');
      expect(callbackSpy).toHaveBeenCalledTimes(2);
      expect(callbackSpy).toHaveBeenCalledWith(ERROR_MESSAGE, undefined, ERROR_STATUS, token);
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(2);
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(2);
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${wsCommand}' should call callback and 'postMessage' to window with error on EOF message`, () => {
    const EOF_STATUS = { code: EOF_CODE };
    ws.dispatchEvent(new MessageEvent('open', {}));

    const params = {};
    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, wsCommand, params, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    const expectedPostedMessage = {
      response: { token, error: EOF, status: EOF_STATUS },
      source: ID,
      timestamp: NOW,
    };

    if (token) {
      postMessageSpy.mockClear();
      ws.dispatchEvent(
        new MessageEvent('message', {
          data: stringifyMessage({ token, error: EOF, status: EOF_STATUS }),
        }),
      );

      expect(postMessageSpy).toHaveBeenCalledTimes(1);
      expect(postMessageSpy).toHaveBeenCalledWith(expectedPostedMessage, '*');
      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(EOF, undefined, EOF_STATUS, token);
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });
});

describe.each([
  [SUBSCRIBE, 'stream'],
  [SEARCH_SUBSCRIBE, 'stream'],
  [SERVICE_REQUEST, 'stream'],
])('Stream Commands', (command, fn) => {
  const wsCommand = command as WsCommand;
  let wrpc: WRPC;
  let ws: WebSocket;
  let sendSpy: jest.SpyInstance;
  let eventsEmitterSpy: jest.SpyInstance;
  let eventsEmitterUnbindSpy: jest.SpyInstance;
  let eventsEmitterBindSpy: jest.SpyInstance;
  let commandFn: (
    c: WsCommand,
    p: CloudVisionParams,
    cb: NotifCallback,
  ) => SubscriptionIdentifier | null;
  const callbackSpy = jest.fn();
  const ERROR_MESSAGE = 'error';
  const ERROR_STATUS = {
    code: 3,
    messages: ERROR_MESSAGE,
  };
  const ACTIVE_STATUS = { code: ACTIVE_CODE };
  const RESULT = { dataset: 'Dodgers' };

  beforeEach(() => {
    jest.resetAllMocks();
    wrpc = new WRPC();
    // @ts-ignore
    commandFn = wrpc[fn];
    wrpc.run('ws://localhost:8080');
    ws = wrpc.websocket;
    sendSpy = jest.spyOn(ws, 'send');
    eventsEmitterSpy = jest.spyOn(wrpc.eventsEmitter, 'emit');
    eventsEmitterBindSpy = jest.spyOn(wrpc.eventsEmitter, 'bind');
    eventsEmitterUnbindSpy = jest.spyOn(wrpc.eventsEmitter, 'unbind');
  });

  afterEach(() => {
    sendSpy.mockClear();
    eventsEmitterSpy.mockClear();
    eventsEmitterBindSpy.mockClear();
    eventsEmitterUnbindSpy.mockClear();
    callbackSpy.mockClear();
  });

  test(`'${fn} + ${wsCommand}' should not send message if socket is not running`, () => {
    const subscriptionId = commandFn.call(wrpc, wsCommand, query, callbackSpy);

    expect(callbackSpy).toHaveBeenCalledWith('Connection is down');
    expect(eventsEmitterSpy).not.toHaveBeenCalled();
    expect(eventsEmitterBindSpy).not.toHaveBeenCalled();
    expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
    expect(subscriptionId).toBe(null);
  });

  test(`'${fn} + ${wsCommand}' should send message if socket is running`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const subscriptionId = commandFn.call(wrpc, wsCommand, query, callbackSpy);
    if (subscriptionId && subscriptionId.token) {
      const token = subscriptionId.token;
      expect(wrpc.streams).not.toContain(token);
      expect(callbackSpy).not.toHaveBeenCalled();
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(
        Parser.stringify({
          token,
          command: wsCommand,
          params: query,
        }),
      );
      expect(subscriptionId).not.toBeNull();
    }
    expect(subscriptionId).not.toBeNull();
  });

  test(`'${fn} + ${wsCommand}' should add to activeStreams if ACK message is received`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const subscriptionId = commandFn.call(wrpc, wsCommand, query, callbackSpy);
    if (subscriptionId && subscriptionId.token) {
      const token = subscriptionId.token;
      ws.dispatchEvent(
        new MessageEvent('message', {
          data: stringifyMessage({ token, status: ACTIVE_STATUS }),
        }),
      );
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(
        Parser.stringify({
          token,
          command: wsCommand,
          params: query,
        }),
      );
      expect(wrpc.streams).toContain(token);
      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(null, undefined, ACTIVE_STATUS, token);
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterSpy).toHaveBeenCalledWith(token, null, undefined, ACTIVE_STATUS);
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(token).not.toBeNull();
    }
    expect(subscriptionId).not.toBeNull();
  });

  test(`'${fn} + ${wsCommand}' should send subscribe message only once`, () => {
    const callbackSpyTwo = jest.fn();
    ws.dispatchEvent(new MessageEvent('open', {}));

    const subscriptionId = commandFn.call(wrpc, wsCommand, query, callbackSpy);
    if (subscriptionId && subscriptionId.token) {
      const token = subscriptionId.token;
      // Active the stream
      ws.dispatchEvent(
        new MessageEvent('message', {
          data: stringifyMessage({ token, status: ACTIVE_STATUS }),
        }),
      );
      const subscriptionIdTwo = commandFn.call(wrpc, wsCommand, query, callbackSpyTwo);
      if (subscriptionIdTwo && subscriptionIdTwo.token) {
        const tokenTwo = subscriptionIdTwo.token;
        expect(wrpc.streams).toContain(token);
        expect(callbackSpy).toHaveBeenCalledTimes(1);
        expect(callbackSpyTwo).toHaveBeenCalledTimes(1);
        expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
        expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
        expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(2);
        expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
        expect(sendSpy).toHaveBeenCalledTimes(1);
        expect(sendSpy).toHaveBeenCalledWith(
          Parser.stringify({
            token,
            command: wsCommand,
            params: query,
          }),
        );
        expect(subscriptionId).not.toBeNull();
        expect(subscriptionId).not.toBe(subscriptionIdTwo);
        expect(token).toBe(tokenTwo);
      }
      expect(subscriptionIdTwo).not.toBeNull();
    }
    expect(subscriptionId).not.toBeNull();
  });

  test(`'${fn} + ${wsCommand}' should send subscribe message only once for simultaneous requests`, () => {
    const callbackSpyTwo = jest.fn();
    ws.dispatchEvent(new MessageEvent('open', {}));

    const subscriptionId = commandFn.call(wrpc, wsCommand, query, callbackSpy);
    const subscriptionIdTwo = commandFn.call(wrpc, wsCommand, query, callbackSpyTwo);
    if (subscriptionId && subscriptionId.token && subscriptionIdTwo && subscriptionIdTwo.token) {
      const token = subscriptionId.token;
      const tokenTwo = subscriptionIdTwo.token;
      // Active the stream
      ws.dispatchEvent(
        new MessageEvent('message', {
          data: stringifyMessage({ token, status: ACTIVE_STATUS }),
        }),
      );

      expect(wrpc.streams).toContain(token);
      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpyTwo).toHaveBeenCalledTimes(1);
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(2);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(
        Parser.stringify({
          token,
          command: wsCommand,
          params: query,
        }),
      );
      expect(subscriptionId).not.toBeNull();
      expect(subscriptionId).not.toBe(subscriptionIdTwo);
      expect(token).toBe(tokenTwo);
    }
    expect(subscriptionIdTwo).not.toBeNull();
    expect(subscriptionId).not.toBeNull();
  });

  test(`'${fn} + ${wsCommand}' should call callback with error on message that throws a send error`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));
    sendSpy.mockImplementation(() => {
      throw ERROR_MESSAGE;
    });

    const subscriptionId = commandFn.call(wrpc, wsCommand, query, callbackSpy);
    if (subscriptionId && subscriptionId.token) {
      const token = subscriptionId.token;
      expect(log).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(
        Parser.stringify({
          token,
          command: wsCommand,
          params: query,
        }),
      );
      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(ERROR_MESSAGE, undefined, undefined, token);
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(subscriptionId).not.toBeNull();
  });

  test(`'${fn} + ${wsCommand}' should call callback and unbind on all errors`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const subscriptionId = commandFn.call(wrpc, wsCommand, query, callbackSpy);
    if (subscriptionId && subscriptionId.token) {
      const token = subscriptionId.token;
      ws.dispatchEvent(
        new MessageEvent('message', {
          data: stringifyMessage({ token, error: ERROR_MESSAGE, status: ERROR_STATUS }),
        }),
      );

      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(ERROR_MESSAGE, undefined, ERROR_STATUS, token);
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterSpy).toHaveBeenCalledWith(token, ERROR_MESSAGE, undefined, ERROR_STATUS);
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(subscriptionId).not.toBeNull();
  });

  test(`'${fn} + ${wsCommand}' should call callback and unbind on all EOF`, () => {
    const EOF_STATUS = { code: EOF_CODE };
    ws.dispatchEvent(new MessageEvent('open', {}));

    const subscriptionId = commandFn.call(wrpc, wsCommand, query, callbackSpy);
    if (subscriptionId && subscriptionId.token) {
      const token = subscriptionId.token;
      ws.dispatchEvent(
        new MessageEvent('message', {
          data: stringifyMessage({ token, error: EOF, status: EOF_STATUS }),
        }),
      );

      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(EOF, undefined, EOF_STATUS, token);
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterSpy).toHaveBeenCalledWith(token, EOF, undefined, EOF_STATUS);
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(subscriptionId).not.toBeNull();
  });

  test(`'${fn} + ${wsCommand}' should call callback on message and not unbind`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const subscriptionId = commandFn.call(wrpc, wsCommand, query, callbackSpy);
    if (subscriptionId && subscriptionId.token) {
      const token = subscriptionId.token;
      ws.dispatchEvent(
        new MessageEvent('message', { data: stringifyMessage({ token, result: RESULT }) }),
      );

      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(null, RESULT, undefined, token);
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterSpy).toHaveBeenCalledWith(token, null, RESULT, undefined);
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(subscriptionId).not.toBeNull();
  });

  test(`'${fn} + ${wsCommand}' should not call callback on message that is not a string`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const subscriptionId = commandFn.call(wrpc, wsCommand, query, callbackSpy);
    if (subscriptionId && subscriptionId.token) {
      const token = subscriptionId.token;
      ws.dispatchEvent(new MessageEvent('message', { data: RESULT }));

      expect(callbackSpy).not.toHaveBeenCalled();
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(subscriptionId).not.toBeNull();
  });

  test(`'${fn} + ${wsCommand}' should not call callback on message without token`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const subscriptionId = commandFn.call(wrpc, wsCommand, query, callbackSpy);
    if (subscriptionId && subscriptionId.token) {
      const token = subscriptionId.token;
      ws.dispatchEvent(new MessageEvent('message', { data: stringifyMessage({ result: RESULT }) }));

      expect(callbackSpy).not.toHaveBeenCalled();
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(subscriptionId).not.toBeNull();
  });

  test(`'${fn} + ${wsCommand}' should not call callback on message that throws error`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const result = '{ data: 1';
    const subscriptionId = commandFn.call(wrpc, wsCommand, query, callbackSpy);
    if (subscriptionId && subscriptionId.token) {
      const token = subscriptionId.token;
      ws.dispatchEvent(new MessageEvent('message', { data: result }));

      expect(log).toHaveBeenCalledTimes(1);
      expect(callbackSpy).not.toHaveBeenCalled();
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(subscriptionId).not.toBeNull();
  });
});

describe.each([
  [SUBSCRIBE, 'stream'],
  [SEARCH_SUBSCRIBE, 'stream'],
  [SERVICE_REQUEST, 'stream'],
])('Close Stream Commands', (command, fn) => {
  const wsCommand = command as WsCommand;
  let wrpc: WRPC;
  let ws: WebSocket;
  let subscriptionId: SubscriptionIdentifier;
  let subscriptionIdTwo: SubscriptionIdentifier;
  let sendSpy: jest.SpyInstance;
  let eventsEmitterSpy: jest.SpyInstance;
  let eventsEmitterUnbindSpy: jest.SpyInstance;
  let eventsEmitterBindSpy: jest.SpyInstance;
  let commandFn: (
    c: WsCommand,
    p: CloudVisionParams,
    cb: NotifCallback,
  ) => SubscriptionIdentifier | null;
  const callbackSpy = jest.fn();
  const callbackSpyTwo = jest.fn();
  const closeCallback = jest.fn();
  const ERROR_MESSAGE = 'error';
  const ERROR_STATUS = {
    code: 3,
    messages: ERROR_MESSAGE,
  };
  const ACTIVE_STATUS = { code: ACTIVE_CODE };
  const EOF_STATUS = { code: EOF_CODE };
  const RESULT = { dataset: 'Dodgers' };

  beforeEach(() => {
    jest.resetAllMocks();
    wrpc = new WRPC();
    // @ts-ignore
    commandFn = wrpc[fn];
    wrpc.run('ws://localhost:8080');
    ws = wrpc.websocket;
    ws.dispatchEvent(new MessageEvent('open', {}));
    const subIdOrNull = commandFn.call(wrpc, wsCommand, query, callbackSpy);
    if (subIdOrNull) {
      subscriptionId = subIdOrNull;
    }
    expect(subIdOrNull).not.toBeNull();
    expect(subscriptionId).toBeDefined();
    const subIdOrNullTwo = commandFn.call(wrpc, wsCommand, {}, callbackSpyTwo);
    if (subIdOrNullTwo) {
      subscriptionIdTwo = subIdOrNullTwo;
    }
    expect(subIdOrNullTwo).not.toBeNull();
    expect(subscriptionIdTwo).toBeDefined();
    ws.dispatchEvent(
      new MessageEvent('message', {
        data: stringifyMessage({ token: subscriptionId.token, status: ACTIVE_STATUS }),
      }),
    );
    sendSpy = jest.spyOn(ws, 'send');
    eventsEmitterSpy = jest.spyOn(wrpc.eventsEmitter, 'emit');
    eventsEmitterBindSpy = jest.spyOn(wrpc.eventsEmitter, 'bind');
    eventsEmitterUnbindSpy = jest.spyOn(wrpc.eventsEmitter, 'unbind');
    callbackSpy.mockClear();
    callbackSpyTwo.mockClear();
  });

  afterEach(() => {
    sendSpy.mockClear();
    eventsEmitterSpy.mockClear();
    eventsEmitterBindSpy.mockClear();
    eventsEmitterUnbindSpy.mockClear();
    callbackSpy.mockClear();
    callbackSpyTwo.mockClear();
    closeCallback.mockClear();
  });

  describe('single stream', () => {
    test(`'${fn} + ${wsCommand}' should send close stream message`, () => {
      const token = wrpc.closeStream(subscriptionId, closeCallback);

      if (token) {
        expect(wrpc.streamInClosingState.get(subscriptionId.token)).toEqual(token);
        expect(closeCallback).not.toHaveBeenCalled();
        expect(callbackSpy).not.toHaveBeenCalled();
        expect(eventsEmitterSpy).not.toHaveBeenCalled();
        expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(1);
        expect(eventsEmitterUnbindSpy).toHaveBeenCalledWith(
          subscriptionId.token,
          subscriptionId.callback,
        );
        expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      }
      expect(token).not.toBeNull();
    });

    test(`'${fn} + ${wsCommand}' should callback with error on close message that throws a send error`, () => {
      sendSpy.mockImplementation(() => {
        throw ERROR_MESSAGE;
      });

      const token = wrpc.closeStream(subscriptionId, closeCallback);

      if (token) {
        expect(wrpc.streamInClosingState.get(subscriptionId.token)).toEqual(undefined);
        expect(closeCallback).toHaveBeenCalledTimes(1);
        expect(closeCallback).toHaveBeenCalledWith(ERROR_MESSAGE, undefined, undefined, token);
        expect(callbackSpy).not.toHaveBeenCalled();
        expect(log).toHaveBeenCalledTimes(1);
        expect(eventsEmitterSpy).not.toHaveBeenCalled();
        expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(1);
        expect(eventsEmitterUnbindSpy).toHaveBeenCalledWith(
          subscriptionId.token,
          subscriptionId.callback,
        );
        expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      }
      expect(token).not.toBeNull();
    });

    test(`'${fn} + ${wsCommand}' should not send close stream message if no streams are present`, () => {
      const token = wrpc.closeStream(
        { token: 'random token', callback: callbackSpy },
        closeCallback,
      );
      expect(token).toBeNull();

      expect(closeCallback).not.toHaveBeenCalled();
      expect(callbackSpy).not.toHaveBeenCalled();
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).not.toHaveBeenCalled();
      expect(sendSpy).not.toHaveBeenCalled();
    });

    test(`'${fn} + ${wsCommand}' should remove stream from closing map when EOF is received`, () => {
      const token = wrpc.closeStream(subscriptionId, closeCallback);

      if (token) {
        expect(wrpc.streamInClosingState.get(subscriptionId.token)).toEqual(token);
        ws.dispatchEvent(
          new MessageEvent('message', {
            data: stringifyMessage({ token, status: EOF_STATUS, error: EOF }),
          }),
        );

        expect(wrpc.streamInClosingState).not.toContain(token);
        expect(closeCallback).toHaveBeenCalledTimes(1);
        expect(closeCallback).toHaveBeenCalledWith(EOF, undefined, EOF_STATUS, token);
        expect(callbackSpy).not.toHaveBeenCalled();
        expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
        expect(eventsEmitterSpy).toHaveBeenCalledWith(token, EOF, undefined, EOF_STATUS);
        expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(1);
        expect(eventsEmitterUnbindSpy).toHaveBeenCalledWith(
          subscriptionId.token,
          subscriptionId.callback,
        );
        expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
        expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      }
      expect(token).not.toBeNull();
    });

    test(`'${fn} + ${wsCommand}' should remove stream from closing map when any error is received`, () => {
      const token = wrpc.closeStream(subscriptionId, closeCallback);

      if (token) {
        expect(wrpc.streamInClosingState.get(subscriptionId.token)).toEqual(token);
        ws.dispatchEvent(
          new MessageEvent('message', {
            data: stringifyMessage({ token, error: ERROR_MESSAGE, status: ERROR_STATUS }),
          }),
        );

        expect(wrpc.streamInClosingState).not.toContain(token);
        expect(closeCallback).toHaveBeenCalledTimes(1);
        expect(closeCallback).toHaveBeenCalledWith(ERROR_MESSAGE, undefined, ERROR_STATUS, token);
        expect(callbackSpy).not.toHaveBeenCalled();
        expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
        expect(eventsEmitterSpy).toHaveBeenCalledWith(
          token,
          ERROR_MESSAGE,
          undefined,
          ERROR_STATUS,
        );
        expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(1);
        expect(eventsEmitterUnbindSpy).toHaveBeenCalledWith(
          subscriptionId.token,
          subscriptionId.callback,
        );
        expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
        expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      }
      expect(token).not.toBeNull();
    });

    test(`'${fn} + ${wsCommand}' should reopen a stream if a stream with the same token is requested while closing`, () => {
      const token = wrpc.closeStream(subscriptionId, closeCallback);

      expect(wrpc.streamInClosingState.get(subscriptionId.token)).toEqual(token);
      const subscriptionIdNew = commandFn.call(wrpc, wsCommand, query, callbackSpyTwo);

      if (token && subscriptionIdNew && subscriptionIdNew.token) {
        expect(callbackSpy).not.toHaveBeenCalled();
        expect(eventsEmitterSpy).not.toHaveBeenCalled();
        expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(1);
        expect(eventsEmitterUnbindSpy).toHaveBeenCalledWith(
          subscriptionId.token,
          subscriptionId.callback,
        );
        expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(2);

        // complete the close process
        sendSpy.mockClear();
        ws.dispatchEvent(
          new MessageEvent('message', {
            data: stringifyMessage({ token, status: EOF_STATUS, error: EOF }),
          }),
        );
        expect(closeCallback).toHaveBeenCalledTimes(1);
        expect(sendSpy).toHaveBeenCalledTimes(1);
        expect(sendSpy).toHaveBeenCalledWith(
          Parser.stringify({
            token: subscriptionIdNew.token,
            command: wsCommand,
            params: query,
          }),
        );

        eventsEmitterSpy.mockClear();
        // Active the stream
        ws.dispatchEvent(
          new MessageEvent('message', {
            data: stringifyMessage({ token: subscriptionIdNew.token, status: ACTIVE_STATUS }),
          }),
        );
        expect(eventsEmitterSpy).toHaveBeenCalledWith(
          subscriptionIdNew.token,
          null,
          undefined,
          ACTIVE_STATUS,
        );
        expect(callbackSpyTwo).toHaveBeenCalledWith(
          null,
          undefined,
          ACTIVE_STATUS,
          subscriptionIdNew.token,
        );

        eventsEmitterSpy.mockClear();
        // send a message
        ws.dispatchEvent(
          new MessageEvent('message', {
            data: stringifyMessage({ token: subscriptionIdNew.token, result: RESULT }),
          }),
        );
        expect(eventsEmitterSpy).toHaveBeenCalledWith(
          subscriptionIdNew.token,
          null,
          RESULT,
          undefined,
        );
        expect(callbackSpyTwo).toHaveBeenCalledWith(
          null,
          RESULT,
          undefined,
          subscriptionIdNew.token,
        );
      }
      expect(token).not.toBeNull();
      expect(subscriptionIdNew).not.toBeNull();
    });
  });

  describe('multiple streams', () => {
    test(`'${fn} + ${wsCommand}' should send close message`, () => {
      const streams = [subscriptionId, subscriptionIdTwo];
      const token = wrpc.closeStreams(streams, closeCallback);

      if (token) {
        expect(closeCallback).not.toHaveBeenCalled();
        expect(callbackSpy).not.toHaveBeenCalled();
        expect(callbackSpyTwo).not.toHaveBeenCalled();
        expect(eventsEmitterSpy).not.toHaveBeenCalled();
        expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(2);
        expect(eventsEmitterUnbindSpy).toHaveBeenNthCalledWith(
          1,
          subscriptionId.token,
          subscriptionId.callback,
        );
        expect(eventsEmitterUnbindSpy).toHaveBeenNthCalledWith(
          2,
          subscriptionIdTwo.token,
          subscriptionIdTwo.callback,
        );
        expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
        expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
        expect(sendSpy).toHaveBeenCalledTimes(1);
        expect(sendSpy).toHaveBeenCalledWith(
          Parser.stringify({
            token,
            command: CLOSE,
            params: { [subscriptionId.token]: true, [subscriptionIdTwo.token]: true },
          }),
        );
      }
      expect(token).not.toBeNull();
    });

    test(`'${fn} + ${wsCommand}' should callback with error on close message that throws a send error`, () => {
      sendSpy.mockImplementation(() => {
        throw ERROR_MESSAGE;
      });

      const streams = [subscriptionId, subscriptionIdTwo];
      const token = wrpc.closeStreams(streams, closeCallback);

      if (token) {
        expect(closeCallback).toHaveBeenCalledTimes(1);
        expect(log).toHaveBeenCalledTimes(1);
        expect(callbackSpy).not.toHaveBeenCalled();
        expect(callbackSpyTwo).not.toHaveBeenCalled();
        expect(eventsEmitterSpy).not.toHaveBeenCalled();
        expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(2);
        expect(eventsEmitterUnbindSpy).toHaveBeenNthCalledWith(
          1,
          subscriptionId.token,
          subscriptionId.callback,
        );
        expect(eventsEmitterUnbindSpy).toHaveBeenNthCalledWith(
          2,
          subscriptionIdTwo.token,
          subscriptionIdTwo.callback,
        );
        expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
        expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
        expect(sendSpy).toHaveBeenCalledTimes(1);
        expect(sendSpy).toHaveBeenCalledWith(
          Parser.stringify({
            token,
            command: CLOSE,
            params: { [subscriptionId.token]: true, [subscriptionIdTwo.token]: true },
          }),
        );
      }
      expect(token).not.toBeNull();
    });

    test(`'${fn} + ${wsCommand}' should not send close stream message if no streams are present`, () => {
      const streams = [
        { token: 'random token', callback: callbackSpy },
        { token: 'another random token', callback: callbackSpyTwo },
      ];
      const token = wrpc.closeStreams(streams, closeCallback);
      expect(token).toBeNull();

      expect(callbackSpy).not.toHaveBeenCalled();
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(2);
      expect(eventsEmitterBindSpy).not.toHaveBeenCalled();
      expect(sendSpy).not.toHaveBeenCalled();
    });

    test(`'${fn} + ${wsCommand}' should remove stream from closing map when EOF is received`, () => {
      const streams = [subscriptionId, subscriptionIdTwo];
      const token = wrpc.closeStreams(streams, closeCallback);

      if (token) {
        expect(wrpc.streamInClosingState.get(subscriptionId.token)).toEqual(token);
        ws.dispatchEvent(
          new MessageEvent('message', {
            data: stringifyMessage({ token, status: EOF_STATUS, error: EOF }),
          }),
        );

        expect(wrpc.streamInClosingState).not.toContain(token);
        expect(closeCallback).toHaveBeenCalledTimes(1);
        expect(closeCallback).toHaveBeenCalledWith(EOF, undefined, EOF_STATUS, token);
        expect(callbackSpy).not.toHaveBeenCalled();
        expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
        expect(eventsEmitterSpy).toHaveBeenCalledWith(token, EOF, undefined, EOF_STATUS);
        expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(2);
        expect(eventsEmitterUnbindSpy).toHaveBeenNthCalledWith(
          1,
          subscriptionId.token,
          subscriptionId.callback,
        );
        expect(eventsEmitterUnbindSpy).toHaveBeenNthCalledWith(
          2,
          subscriptionIdTwo.token,
          subscriptionIdTwo.callback,
        );
        expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
        expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      }
      expect(token).not.toBeNull();
    });

    test(`'${fn} + ${wsCommand}' should remove stream from closing map when any error is received`, () => {
      const streams = [subscriptionId, subscriptionIdTwo];
      const token = wrpc.closeStreams(streams, closeCallback);

      if (token) {
        expect(wrpc.streamInClosingState.get(subscriptionId.token)).toEqual(token);
        ws.dispatchEvent(
          new MessageEvent('message', {
            data: stringifyMessage({ token, error: ERROR_MESSAGE, status: ERROR_STATUS }),
          }),
        );

        expect(wrpc.streamInClosingState).not.toContain(token);
        expect(closeCallback).toHaveBeenCalledTimes(1);
        expect(closeCallback).toHaveBeenCalledWith(ERROR_MESSAGE, undefined, ERROR_STATUS, token);
        expect(callbackSpy).not.toHaveBeenCalled();
        expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
        expect(eventsEmitterSpy).toHaveBeenCalledWith(
          token,
          ERROR_MESSAGE,
          undefined,
          ERROR_STATUS,
        );
        expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(2);
        expect(eventsEmitterUnbindSpy).toHaveBeenNthCalledWith(
          1,
          subscriptionId.token,
          subscriptionId.callback,
        );
        expect(eventsEmitterUnbindSpy).toHaveBeenNthCalledWith(
          2,
          subscriptionIdTwo.token,
          subscriptionIdTwo.callback,
        );
        expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
        expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      }
      expect(token).not.toBeNull();
    });

    test(`'${fn} + ${wsCommand}' should reopen a stream if a stream with the same token is requested while closing`, () => {
      const streams = [subscriptionId, subscriptionIdTwo];
      const token = wrpc.closeStreams(streams, closeCallback);

      expect(wrpc.streamInClosingState.get(subscriptionId.token)).toEqual(token);
      const subscriptionIdNew = commandFn.call(wrpc, wsCommand, query, callbackSpyTwo);

      if (token && subscriptionIdNew && subscriptionIdNew.token) {
        expect(callbackSpy).not.toHaveBeenCalled();
        expect(eventsEmitterSpy).not.toHaveBeenCalled();
        expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(2);
        expect(eventsEmitterUnbindSpy).toHaveBeenNthCalledWith(
          1,
          subscriptionId.token,
          subscriptionId.callback,
        );
        expect(eventsEmitterUnbindSpy).toHaveBeenNthCalledWith(
          2,
          subscriptionIdTwo.token,
          subscriptionIdTwo.callback,
        );
        expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(2);

        // complete the close process
        sendSpy.mockClear();
        ws.dispatchEvent(
          new MessageEvent('message', {
            data: stringifyMessage({ token, status: EOF_STATUS, error: EOF }),
          }),
        );
        expect(closeCallback).toHaveBeenCalledTimes(1);
        expect(sendSpy).toHaveBeenCalledTimes(1);
        expect(sendSpy).toHaveBeenCalledWith(
          Parser.stringify({
            token: subscriptionIdNew.token,
            command: wsCommand,
            params: query,
          }),
        );

        eventsEmitterSpy.mockClear();
        // Active the stream
        ws.dispatchEvent(
          new MessageEvent('message', {
            data: stringifyMessage({ token: subscriptionIdNew.token, status: ACTIVE_STATUS }),
          }),
        );
        expect(eventsEmitterSpy).toHaveBeenCalledWith(
          subscriptionIdNew.token,
          null,
          undefined,
          ACTIVE_STATUS,
        );
        expect(callbackSpyTwo).toHaveBeenCalledWith(
          null,
          undefined,
          ACTIVE_STATUS,
          subscriptionIdNew.token,
        );

        eventsEmitterSpy.mockClear();
        // send a message
        ws.dispatchEvent(
          new MessageEvent('message', {
            data: stringifyMessage({ token: subscriptionIdNew.token, result: RESULT }),
          }),
        );
        expect(eventsEmitterSpy).toHaveBeenCalledWith(
          subscriptionIdNew.token,
          null,
          RESULT,
          undefined,
        );
        expect(callbackSpyTwo).toHaveBeenCalledWith(
          null,
          RESULT,
          undefined,
          subscriptionIdNew.token,
        );
      }
      expect(token).not.toBeNull();
      expect(subscriptionIdNew).not.toBeNull();
    });
  });
});

describe('enableOptions', () => {
  let wrpc: WRPC;
  let ws: WebSocket;
  let sendSpy: jest.SpyInstance;
  let eventsEmitterSpy: jest.SpyInstance;
  const ERROR_MESSAGE = 'error';
  const ERROR_STATUS = {
    code: 3,
    messages: ERROR_MESSAGE,
  };
  const PAUSE_STATUS = {
    code: PAUSED_CODE,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    wrpc = new WRPC({
      pauseStreams: true,
      batchResults: true,
      debugMode: false,
    });
    // @ts-ignore
    wrpc.run('ws://localhost:8080');
    ws = wrpc.websocket;
    sendSpy = jest.spyOn(ws, 'send');
    eventsEmitterSpy = jest.spyOn(wrpc.eventsEmitter, 'emit');
  });

  afterEach(() => {
    sendSpy.mockClear();
    eventsEmitterSpy.mockClear();
  });

  test('should enable options on WS open', () => {
    const token = makeToken(PAUSE, { pauseStreams: true });
    ws.dispatchEvent(new MessageEvent('open', {}));

    expect(sendSpy).toHaveBeenCalledTimes(1);
    expect(sendSpy).toHaveBeenCalledWith(
      Parser.stringify({
        token,
        command: PAUSE,
        params: { pauseStreams: true },
      }),
    );
  });

  test('should log error on enable options error', () => {
    const token = makeToken(PAUSE, { pauseStreams: true });
    ws.dispatchEvent(new MessageEvent('open', {}));

    ws.dispatchEvent(
      new MessageEvent('message', {
        data: stringifyMessage({ token, error: ERROR_MESSAGE, status: ERROR_STATUS }),
      }),
    );

    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(ERROR, ERROR_MESSAGE, ERROR_STATUS, token);
  });

  test('should resume as soon as server sends back pause status', () => {
    const token = 'some request';
    ws.dispatchEvent(new MessageEvent('open', {}));

    ws.dispatchEvent(
      new MessageEvent('message', {
        data: stringifyMessage({ token, status: PAUSE_STATUS }),
      }),
    );

    expect(log).not.toHaveBeenCalled();
    expect(eventsEmitterSpy).not.toHaveBeenCalled();
  });

  test('should log resume call error but not on other messages', () => {
    const token = 'some request';
    const resumeToken = makeToken(RESUME, { token });
    ws.dispatchEvent(new MessageEvent('open', {}));

    ws.dispatchEvent(
      new MessageEvent('message', {
        data: stringifyMessage({ token, status: PAUSE_STATUS }),
      }),
    );

    ws.dispatchEvent(
      new MessageEvent('message', {
        data: stringifyMessage({ token: resumeToken, result: {} }),
      }),
    );

    expect(log).not.toHaveBeenCalled();
    expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
    expect(eventsEmitterSpy).toHaveBeenCalledWith(resumeToken, null, {}, undefined);

    eventsEmitterSpy.mockClear();
    ws.dispatchEvent(
      new MessageEvent('message', {
        data: stringifyMessage({ token: resumeToken, status: ERROR_STATUS, error: ERROR_MESSAGE }),
      }),
    );

    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(ERROR, ERROR_MESSAGE, ERROR_STATUS);
    expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
    expect(eventsEmitterSpy).toHaveBeenCalledWith(
      resumeToken,
      ERROR_MESSAGE,
      undefined,
      ERROR_STATUS,
    );
  });
});
