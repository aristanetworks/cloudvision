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

import Parser from '../src/Parser';
import Wrpc from '../src/Wrpc';
import {
  ACTIVE_CODE,
  CLOSE,
  EOF,
  EOF_CODE,
  ERROR,
  GET,
  GET_DATASETS,
  GET_REQUEST_COMPLETED,
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
import { makeToken, toBinaryKey } from '../src/utils';
import {
  CloudVisionParams,
  CloudVisionQueryMessage,
  CloudVisionStatus,
  NotifCallback,
  QueryParams,
  RequestContext,
  StreamCommand,
  SubscriptionIdentifier,
  WsCommand,
  CloudVisionMetaData,
} from '../types';

interface PolymorphicCommandFunction {
  (command: WsCommand, params: CloudVisionParams, callback: NotifCallback): string;
}

interface CommandFunction {
  (p: CloudVisionParams, cb: NotifCallback): string;
}

interface PostedMessage {
  source: string;
  timestamp: number;

  request?: CloudVisionQueryMessage;
  response?:
    | {
        result: { dataset: string };
        token: string;
      }
    | {
        error: string;
        status: CloudVisionStatus;
        token: string;
      };
}

type WrpcMethod = 'get' | 'pause' | 'publish' | 'requestService' | 'resume' | 'search';

const query: QueryParams = { query: [] };

jest.mock('../src/Parser', () => ({
  parse: (res: string) => JSON.parse(res),
  stringify: (msg: CloudVisionQueryMessage) => JSON.stringify(msg),
}));

jest.mock('../src/logger', () => {
  return { log: jest.fn() };
});

jest.spyOn(console, 'groupCollapsed').mockImplementation();

function stringifyMessage(msg: Record<string, unknown>) {
  return JSON.stringify(msg);
}

function createRequestContext(command: WsCommand, token: string, params: unknown): RequestContext {
  return {
    command,
    token,
    encodedParams: toBinaryKey(params),
  };
}

describe('open/close/connection', () => {
  let wrpc: Wrpc;
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
    wrpc = new Wrpc();
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
    // @ts-ignore: Need to access private member
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
    expect(connectionSpy).toHaveBeenCalledWith(Wrpc.CONNECTED, expect.any(Event));
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
    expect(connectionSpy).toHaveBeenCalledWith(Wrpc.CONNECTED, expect.any(Event));
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
      Wrpc.DISCONNECTED,
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
    expect(connectionSpy).toHaveBeenCalledWith(Wrpc.DISCONNECTED, expect.any(CloseEvent));
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
      Wrpc.DISCONNECTED,
      expect.any(CloseEvent),
    );
    expect(connectionSpy).toHaveBeenCalledTimes(1);
    expect(connectionSpy).toHaveBeenCalledWith(Wrpc.DISCONNECTED, expect.any(CloseEvent));
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

describe.each<[WsCommand, WrpcMethod, boolean]>([
  [GET, 'get', true],
  [GET_DATASETS, 'get', true],
  [PUBLISH, 'publish', false],
  [SEARCH, 'search', false],
  [SERVICE_REQUEST, 'requestService', false],
  [RESUME, 'resume', false],
  [PAUSE, 'pause', false],
])('Call Commands', (command, fn, polymorphic) => {
  let wrpc: Wrpc;
  let ws: WebSocket;
  let sendSpy: jest.SpyInstance;
  let eventsEmitterSpy: jest.SpyInstance;
  let eventsEmitterUnbindSpy: jest.SpyInstance;
  let eventsEmitterBindSpy: jest.SpyInstance;
  let polymorphicCommandFn: PolymorphicCommandFunction;
  let commandFn: CommandFunction;
  const callbackSpy = jest.fn();
  const ERROR_MESSAGE = 'error';
  const ERROR_STATUS: CloudVisionStatus = {
    code: 3,
    message: ERROR_MESSAGE,
  };
  const RESULT = { dataset: 'Dodgers' };

  beforeEach(() => {
    jest.resetAllMocks();
    wrpc = new Wrpc();
    // @ts-ignore Easier than to type everything
    commandFn = wrpc[fn];
    // @ts-ignore Easier than to type everything
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

  test(`'${fn} + ${command}' should not send message if socket is not running`, () => {
    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, command, {}, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }

    expect(callbackSpy).toHaveBeenCalledWith('Connection is down');
    expect(eventsEmitterSpy).not.toHaveBeenCalled();
    expect(eventsEmitterBindSpy).not.toHaveBeenCalled();
    expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
    expect(token).toBe(null);
  });

  test(`'${fn} + ${command}' should send message if socket is running`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, command, {}, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    if (token) {
      expect(callbackSpy).not.toHaveBeenCalled();
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
        token,
        createRequestContext(command, token, {}),
        expect.any(Function),
      );
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(
        Parser.stringify({
          token,
          command,
          params: {},
        }),
      );
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${command}' call callback with error on message that throws a send error`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));
    sendSpy.mockImplementation(() => {
      throw ERROR_MESSAGE;
    });

    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, command, {}, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    if (token) {
      const requestContext = createRequestContext(command, token, {});
      expect(log).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(
        Parser.stringify({
          token,
          command,
          params: {},
        }),
      );
      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(
        ERROR_MESSAGE,
        undefined,
        undefined,
        token,
        requestContext,
      );
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
        token,
        requestContext,
        expect.any(Function),
      );
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${command}' should call callback and unbind on all errors`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, command, {}, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    if (token) {
      const requestContext = createRequestContext(command, token, {});
      ws.dispatchEvent(
        new MessageEvent('message', {
          data: stringifyMessage({ token, error: ERROR_MESSAGE, status: ERROR_STATUS }),
        }),
      );

      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(
        ERROR_MESSAGE,
        undefined,
        ERROR_STATUS,
        token,
        requestContext,
      );
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterSpy).toHaveBeenCalledWith(token, ERROR_MESSAGE, undefined, ERROR_STATUS);
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
        token,
        requestContext,
        expect.any(Function),
      );
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${command}' should call callback and unbind on all EOF`, () => {
    const EOF_STATUS: CloudVisionStatus = { code: EOF_CODE };
    ws.dispatchEvent(new MessageEvent('open', {}));

    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, command, {}, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    if (token) {
      const requestContext = createRequestContext(command, token, {});
      ws.dispatchEvent(
        new MessageEvent('message', {
          data: stringifyMessage({ token, error: EOF, status: EOF_STATUS }),
        }),
      );

      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(EOF, undefined, EOF_STATUS, token, requestContext);
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterSpy).toHaveBeenCalledWith(token, EOF, undefined, EOF_STATUS);
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
        token,
        requestContext,
        expect.any(Function),
      );
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${command}' should call callback on message and not unbind`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, command, {}, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    if (token) {
      const requestContext = createRequestContext(command, token, {});
      ws.dispatchEvent(
        new MessageEvent('message', { data: stringifyMessage({ token, result: RESULT }) }),
      );

      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(null, RESULT, undefined, token, requestContext);
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterSpy).toHaveBeenCalledWith(token, null, RESULT, undefined);
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
        token,
        requestContext,
        expect.any(Function),
      );
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${command}' should not call callback on message that is not a string`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, command, {}, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    if (token) {
      ws.dispatchEvent(new MessageEvent('message', { data: RESULT }));

      expect(callbackSpy).not.toHaveBeenCalled();
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
        token,
        createRequestContext(command, token, {}),
        expect.any(Function),
      );
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${command}' should not call callback on message without token`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, command, {}, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    if (token) {
      ws.dispatchEvent(new MessageEvent('message', { data: stringifyMessage({ result: RESULT }) }));

      expect(callbackSpy).not.toHaveBeenCalled();
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
        token,
        createRequestContext(command, token, {}),
        expect.any(Function),
      );
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${command}' should not call callback on message that throws error`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const result = '{ data: 1';
    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, command, {}, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    if (token) {
      ws.dispatchEvent(new MessageEvent('message', { data: result }));

      expect(log).toHaveBeenCalledTimes(1);
      expect(callbackSpy).not.toHaveBeenCalled();
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
        token,
        createRequestContext(command, token, {}),
        expect.any(Function),
      );
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });
});

describe.each<[WsCommand, WrpcMethod, boolean]>([
  [GET_DATASETS, 'get', true],
  [GET, 'get', true],
  [PUBLISH, 'publish', false],
  [SEARCH, 'search', false],
  [SERVICE_REQUEST, 'requestService', false],
  [RESUME, 'resume', false],
  [PAUSE, 'pause', false],
])('Call Commands in debug mode', (command, fn, polymorphic) => {
  let NOW = 0;
  let wrpc: Wrpc;
  let ws: WebSocket;
  let sendSpy: jest.SpyInstance;
  let postMessageSpy: jest.SpyInstance;
  let eventsEmitterSpy: jest.SpyInstance;
  let eventsEmitterUnbindSpy: jest.SpyInstance;
  let eventsEmitterBindSpy: jest.SpyInstance;
  let commandFn: CommandFunction;
  let polymorphicCommandFn: PolymorphicCommandFunction;
  const callbackSpy = jest.fn();
  const ERROR_MESSAGE = 'error';
  const ERROR_STATUS: CloudVisionStatus = {
    code: 3,
    message: ERROR_MESSAGE,
  };
  const RESULT = { dataset: 'Dodgers' };

  beforeEach(() => {
    jest.resetAllMocks();
    NOW = Date.now();
    Date.now = jest.fn(() => NOW);
    wrpc = new Wrpc({
      pauseStreams: false,
      batchResults: true,
      debugMode: true,
    });
    // @ts-ignore Easier than to type everything
    commandFn = wrpc[fn];
    // @ts-ignore Easier than to type everything
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

  test(`'${fn} + ${command}' should send message and 'postMessage' to window`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const params: CloudVisionParams = {};
    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, command, params, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    const expectedMessage: CloudVisionQueryMessage = {
      token,
      command,
      params,
    };
    const expectedPostedMessage: PostedMessage = {
      request: expectedMessage,
      source: ID,
      timestamp: NOW,
    };

    if (token) {
      expect(postMessageSpy).toHaveBeenCalledWith(expectedPostedMessage, '*');
      expect(callbackSpy).not.toHaveBeenCalled();
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
        token,
        createRequestContext(command, token, params),
        expect.any(Function),
      );
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(
        Parser.stringify({
          token,
          command,
          params: {},
        }),
      );
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${command}' should call callback and 'postMessage' to window on message`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const params: CloudVisionParams = {};
    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, command, params, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    const expectedPostedMessage: PostedMessage = {
      response: { token, result: RESULT },
      source: ID,
      timestamp: NOW,
    };

    if (token) {
      const requestContext = createRequestContext(command, token, params);
      postMessageSpy.mockClear();
      ws.dispatchEvent(
        new MessageEvent('message', { data: stringifyMessage({ token, result: RESULT }) }),
      );

      expect(postMessageSpy).toHaveBeenCalledTimes(1);
      expect(postMessageSpy).toHaveBeenCalledWith(expectedPostedMessage, '*');
      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(null, RESULT, undefined, token, requestContext);
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
        token,
        requestContext,
        expect.any(Function),
      );
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${command}' should send message and 'postMessage' to window only once`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const params: CloudVisionParams = {};
    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, command, params, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    const expectedMessage: CloudVisionQueryMessage = {
      token,
      command,
      params,
    };
    const expectedPostedMessage: PostedMessage = {
      request: expectedMessage,
      source: ID,
      timestamp: NOW,
    };

    // second call
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, command, params, callbackSpy);
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
          command,
          params: {},
        }),
      );
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${command}' should call callback and 'postMessage' to window on message only once for multiple callbacks`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const params: CloudVisionParams = {};
    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, command, params, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    const expectedPostedMessage: PostedMessage = {
      response: { token, result: RESULT },
      source: ID,
      timestamp: NOW,
    };

    // second call
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, command, params, callbackSpy);
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
      expect(callbackSpy).toHaveBeenCalledWith(
        null,
        RESULT,
        undefined,
        token,
        createRequestContext(command, token, params),
      );
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(2);
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${command}' should call callback and 'postMessage' to window with error on error message`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const params: CloudVisionParams = {};
    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, command, params, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    const expectedPostedMessage: PostedMessage = {
      response: { token, error: ERROR_MESSAGE, status: ERROR_STATUS },
      source: ID,
      timestamp: NOW,
    };

    if (token) {
      const requestContext = createRequestContext(command, token, params);
      postMessageSpy.mockClear();
      ws.dispatchEvent(
        new MessageEvent('message', {
          data: stringifyMessage({ token, error: ERROR_MESSAGE, status: ERROR_STATUS }),
        }),
      );

      expect(postMessageSpy).toHaveBeenCalledTimes(1);
      expect(postMessageSpy).toHaveBeenCalledWith(expectedPostedMessage, '*');
      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(
        ERROR_MESSAGE,
        undefined,
        ERROR_STATUS,
        token,
        requestContext,
      );
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
        token,
        requestContext,
        expect.any(Function),
      );
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${command}' should call callback and 'postMessage' to window with error on error message for each callback`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const params: CloudVisionParams = {};
    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, command, params, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    const expectedPostedMessage: PostedMessage = {
      response: { token, error: ERROR_MESSAGE, status: ERROR_STATUS },
      source: ID,
      timestamp: NOW,
    };

    // second call
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, command, params, callbackSpy);
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
      expect(callbackSpy).toHaveBeenCalledWith(
        ERROR_MESSAGE,
        undefined,
        ERROR_STATUS,
        token,
        createRequestContext(command, token, params),
      );
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(2);
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(2);
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${command}' should call callback and 'postMessage' to window with error on EOF message`, () => {
    const EOF_STATUS: CloudVisionStatus = { code: EOF_CODE };
    ws.dispatchEvent(new MessageEvent('open', {}));

    const params: CloudVisionParams = {};
    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, command, params, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    const expectedPostedMessage: PostedMessage = {
      response: { token, error: EOF, status: EOF_STATUS },
      source: ID,
      timestamp: NOW,
    };

    if (token) {
      const requestContext = createRequestContext(command, token, params);
      postMessageSpy.mockClear();
      ws.dispatchEvent(
        new MessageEvent('message', {
          data: stringifyMessage({ token, error: EOF, status: EOF_STATUS }),
        }),
      );

      expect(postMessageSpy).toHaveBeenCalledTimes(1);
      expect(postMessageSpy).toHaveBeenCalledWith(expectedPostedMessage, '*');
      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(EOF, undefined, EOF_STATUS, token, requestContext);
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
        token,
        requestContext,
        expect.any(Function),
      );
      expect(token).not.toBeNull();
    }
    expect(token).not.toBeNull();
  });
});

describe.each<[StreamCommand, 'stream']>([
  [SUBSCRIBE, 'stream'],
  [SEARCH_SUBSCRIBE, 'stream'],
  [SERVICE_REQUEST, 'stream'],
])('Stream Commands', (command, fn) => {
  let wrpc: Wrpc;
  let ws: WebSocket;
  let sendSpy: jest.SpyInstance;
  let eventsEmitterSpy: jest.SpyInstance;
  let eventsEmitterUnbindSpy: jest.SpyInstance;
  let eventsEmitterBindSpy: jest.SpyInstance;
  let commandFn: Wrpc['stream'];
  const callbackSpy = jest.fn();
  const ERROR_MESSAGE = 'error';
  const ERROR_STATUS: CloudVisionStatus = {
    code: 3,
    message: ERROR_MESSAGE,
  };
  const ACTIVE_STATUS: CloudVisionStatus = { code: ACTIVE_CODE };
  const RESULT = { dataset: 'Dodgers' };

  beforeEach(() => {
    jest.resetAllMocks();
    wrpc = new Wrpc();
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

  test(`'${fn} + ${command}' should not send message if socket is not running`, () => {
    const subscriptionId = commandFn.call(wrpc, command, query, callbackSpy);

    expect(callbackSpy).toHaveBeenCalledWith('Connection is down');
    expect(eventsEmitterSpy).not.toHaveBeenCalled();
    expect(eventsEmitterBindSpy).not.toHaveBeenCalled();
    expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
    expect(subscriptionId).toBe(null);
  });

  test(`'${fn} + ${command}' should send message if socket is running`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const subscriptionId = commandFn.call(wrpc, command, query, callbackSpy);
    if (subscriptionId && subscriptionId.token) {
      const token = subscriptionId.token;
      expect(wrpc.streams).not.toContain(token);
      expect(callbackSpy).not.toHaveBeenCalled();
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
        token,
        createRequestContext(command, token, query),
        expect.any(Function),
      );
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(
        Parser.stringify({
          token,
          command,
          params: query,
        }),
      );
      expect(subscriptionId).not.toBeNull();
    }
    expect(subscriptionId).not.toBeNull();
  });

  test(`'${fn} + ${command}' should add to activeStreams if ACK message is received`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const subscriptionId = commandFn.call(wrpc, command, query, callbackSpy);
    if (subscriptionId && subscriptionId.token) {
      const token = subscriptionId.token;
      const requestContext = createRequestContext(command, token, query);
      ws.dispatchEvent(
        new MessageEvent('message', {
          data: stringifyMessage({ token, status: ACTIVE_STATUS }),
        }),
      );
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(
        Parser.stringify({
          token,
          command,
          params: query,
        }),
      );
      expect(wrpc.streams).toContain(token);
      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(
        null,
        undefined,
        ACTIVE_STATUS,
        token,
        requestContext,
      );
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterSpy).toHaveBeenCalledWith(token, null, undefined, ACTIVE_STATUS);
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
        token,
        requestContext,
        expect.any(Function),
      );
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(token).not.toBeNull();
    }
    expect(subscriptionId).not.toBeNull();
  });

  test(`'${fn} + ${command}' should send subscribe message only once`, () => {
    const callbackSpyTwo = jest.fn();
    ws.dispatchEvent(new MessageEvent('open', {}));

    const subscriptionId = commandFn.call(wrpc, command, query, callbackSpy);
    if (subscriptionId && subscriptionId.token) {
      const token = subscriptionId.token;
      // Active the stream
      ws.dispatchEvent(
        new MessageEvent('message', {
          data: stringifyMessage({ token, status: ACTIVE_STATUS }),
        }),
      );
      const subscriptionIdTwo = commandFn.call(wrpc, command, query, callbackSpyTwo);
      if (subscriptionIdTwo && subscriptionIdTwo.token) {
        const tokenTwo = subscriptionIdTwo.token;
        expect(wrpc.streams).toContain(token);
        expect(callbackSpy).toHaveBeenCalledTimes(1);
        expect(callbackSpyTwo).toHaveBeenCalledTimes(1);
        expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
        expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
        expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(2);
        expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
          token,
          createRequestContext(command, token, query),
          expect.any(Function),
        );
        expect(sendSpy).toHaveBeenCalledTimes(1);
        expect(sendSpy).toHaveBeenCalledWith(
          Parser.stringify({
            token,
            command,
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

  test(`'${fn} + ${command}' should send subscribe message only once for simultaneous requests`, () => {
    const callbackSpyTwo = jest.fn();
    ws.dispatchEvent(new MessageEvent('open', {}));

    const subscriptionId = commandFn.call(wrpc, command, query, callbackSpy);
    const subscriptionIdTwo = commandFn.call(wrpc, command, query, callbackSpyTwo);
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
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
        token,
        createRequestContext(command, token, query),
        expect.any(Function),
      );
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(
        Parser.stringify({
          token,
          command,
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

  test(`'${fn} + ${command}' should call callback with error on message that throws a send error`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));
    sendSpy.mockImplementation(() => {
      throw ERROR_MESSAGE;
    });

    const subscriptionId = commandFn.call(wrpc, command, query, callbackSpy);
    if (subscriptionId && subscriptionId.token) {
      const token = subscriptionId.token;
      const requestContext = createRequestContext(command, token, query);
      expect(log).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(
        Parser.stringify({
          token,
          command,
          params: query,
        }),
      );
      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(
        ERROR_MESSAGE,
        undefined,
        undefined,
        token,
        requestContext,
      );
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
        token,
        requestContext,
        expect.any(Function),
      );
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(subscriptionId).not.toBeNull();
  });

  test(`'${fn} + ${command}' should call callback and unbind on all errors`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const subscriptionId = commandFn.call(wrpc, command, query, callbackSpy);
    if (subscriptionId && subscriptionId.token) {
      const token = subscriptionId.token;
      const requestContext = createRequestContext(command, token, query);
      ws.dispatchEvent(
        new MessageEvent('message', {
          data: stringifyMessage({ token, error: ERROR_MESSAGE, status: ERROR_STATUS }),
        }),
      );

      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(
        ERROR_MESSAGE,
        undefined,
        ERROR_STATUS,
        token,
        requestContext,
      );
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterSpy).toHaveBeenCalledWith(token, ERROR_MESSAGE, undefined, ERROR_STATUS);
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
        token,
        requestContext,
        expect.any(Function),
      );
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(subscriptionId).not.toBeNull();
  });

  test(`'${fn} + ${command}' should call callback and unbind on all EOF`, () => {
    const EOF_STATUS: CloudVisionStatus = { code: EOF_CODE };
    ws.dispatchEvent(new MessageEvent('open', {}));

    const subscriptionId = commandFn.call(wrpc, command, query, callbackSpy);
    if (subscriptionId && subscriptionId.token) {
      const token = subscriptionId.token;
      const requestContext = createRequestContext(command, token, query);
      ws.dispatchEvent(
        new MessageEvent('message', {
          data: stringifyMessage({ token, error: EOF, status: EOF_STATUS }),
        }),
      );

      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(EOF, undefined, EOF_STATUS, token, requestContext);
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterSpy).toHaveBeenCalledWith(token, EOF, undefined, EOF_STATUS);
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
        token,
        requestContext,
        expect.any(Function),
      );
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(subscriptionId).not.toBeNull();
  });

  test(`'${fn} + ${command}' should call callback and not unbind on get request EOF`, () => {
    const METADATA: CloudVisionMetaData<string> = { [GET_REQUEST_COMPLETED]: EOF };
    const EOF_STATUS: CloudVisionStatus = { code: EOF_CODE, message: GET_REQUEST_COMPLETED };
    const RESULT_WITH_META = { ...RESULT, metadata: METADATA };
    ws.dispatchEvent(new MessageEvent('open', {}));

    const subscriptionId = commandFn.call(wrpc, command, query, callbackSpy);
    if (subscriptionId && subscriptionId.token) {
      const token = subscriptionId.token;
      const requestContext = createRequestContext(command, token, query);
      ws.dispatchEvent(
        new MessageEvent('message', {
          data: stringifyMessage({ token, result: RESULT_WITH_META }),
        }),
      );

      expect(callbackSpy).toHaveBeenCalledTimes(2);
      expect(callbackSpy).toHaveBeenNthCalledWith(
        1,
        null,
        RESULT_WITH_META,
        undefined,
        token,
        requestContext,
      );
      expect(callbackSpy).toHaveBeenNthCalledWith(2, null, null, EOF_STATUS, token, requestContext);
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(2);
      expect(eventsEmitterSpy).toHaveBeenNthCalledWith(1, token, null, RESULT_WITH_META, undefined);
      expect(eventsEmitterSpy).toHaveBeenNthCalledWith(2, token, null, null, EOF_STATUS);
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
        token,
        requestContext,
        expect.any(Function),
      );
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(0);
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(subscriptionId).not.toBeNull();
  });

  test(`'${fn} + ${command}' should call callback on message and not unbind`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const subscriptionId = commandFn.call(wrpc, command, query, callbackSpy);
    if (subscriptionId && subscriptionId.token) {
      const token = subscriptionId.token;
      const requestContext = createRequestContext(command, token, query);
      ws.dispatchEvent(
        new MessageEvent('message', { data: stringifyMessage({ token, result: RESULT }) }),
      );

      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(null, RESULT, undefined, token, requestContext);
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterSpy).toHaveBeenCalledWith(token, null, RESULT, undefined);
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
        token,
        requestContext,
        expect.any(Function),
      );
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(subscriptionId).not.toBeNull();
  });

  test(`'${fn} + ${command}' should not call callback on message that is not a string`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const subscriptionId = commandFn.call(wrpc, command, query, callbackSpy);
    if (subscriptionId && subscriptionId.token) {
      const token = subscriptionId.token;
      ws.dispatchEvent(new MessageEvent('message', { data: RESULT }));

      expect(callbackSpy).not.toHaveBeenCalled();
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
        token,
        createRequestContext(command, token, query),
        expect.any(Function),
      );
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(subscriptionId).not.toBeNull();
  });

  test(`'${fn} + ${command}' should not call callback on message without token`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const subscriptionId = commandFn.call(wrpc, command, query, callbackSpy);
    if (subscriptionId && subscriptionId.token) {
      const token = subscriptionId.token;
      ws.dispatchEvent(new MessageEvent('message', { data: stringifyMessage({ result: RESULT }) }));

      expect(callbackSpy).not.toHaveBeenCalled();
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
        token,
        createRequestContext(command, token, query),
        expect.any(Function),
      );
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(subscriptionId).not.toBeNull();
  });

  test(`'${fn} + ${command}' should not call callback on message that throws error`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const result = '{ data: 1';
    const subscriptionId = commandFn.call(wrpc, command, query, callbackSpy);
    if (subscriptionId && subscriptionId.token) {
      const token = subscriptionId.token;
      ws.dispatchEvent(new MessageEvent('message', { data: result }));

      expect(log).toHaveBeenCalledTimes(1);
      expect(callbackSpy).not.toHaveBeenCalled();
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
        token,
        createRequestContext(command, token, query),
        expect.any(Function),
      );
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(token).not.toBeNull();
    }
    expect(subscriptionId).not.toBeNull();
  });
});

describe.each<[StreamCommand, 'stream']>([
  [SUBSCRIBE, 'stream'],
  [SEARCH_SUBSCRIBE, 'stream'],
  [SERVICE_REQUEST, 'stream'],
])('Close Stream Commands', (command, fn) => {
  let wrpc: Wrpc;
  let ws: WebSocket;
  let subscriptionId: SubscriptionIdentifier;
  let subscriptionIdTwo: SubscriptionIdentifier;
  let sendSpy: jest.SpyInstance;
  let eventsEmitterSpy: jest.SpyInstance;
  let eventsEmitterUnbindSpy: jest.SpyInstance;
  let eventsEmitterBindSpy: jest.SpyInstance;
  let commandFn: Wrpc['stream'];
  const callbackSpy = jest.fn();
  const callbackSpyTwo = jest.fn();
  const closeCallback = jest.fn();
  const ERROR_MESSAGE = 'error';
  const ERROR_STATUS: CloudVisionStatus = {
    code: 3,
    message: ERROR_MESSAGE,
  };
  const ACTIVE_STATUS: CloudVisionStatus = { code: ACTIVE_CODE };
  const EOF_STATUS: CloudVisionStatus = { code: EOF_CODE };
  const RESULT = { dataset: 'Dodgers' };

  beforeEach(() => {
    jest.resetAllMocks();
    wrpc = new Wrpc();
    commandFn = wrpc[fn];
    wrpc.run('ws://localhost:8080');
    ws = wrpc.websocket;
    ws.dispatchEvent(new MessageEvent('open', {}));

    const subIdOrNull = commandFn.call(wrpc, command, query, callbackSpy);
    if (subIdOrNull) {
      subscriptionId = subIdOrNull;
    }
    expect(subIdOrNull).not.toBeNull();
    expect(subscriptionId).toBeDefined();

    const subIdOrNullTwo = commandFn.call(wrpc, command, {}, callbackSpyTwo);
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
    test(`'${fn} + ${command}' should send close stream message`, () => {
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

    test(`'${fn} + ${command}' should callback with error on close message that throws a send error`, () => {
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

    test(`'${fn} + ${command}' should not send close stream message if no streams are present`, () => {
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

    test(`'${fn} + ${command}' should remove stream from closing map when EOF is received`, () => {
      const token = wrpc.closeStream(subscriptionId, closeCallback);

      if (token) {
        const requestContext = createRequestContext(CLOSE, token, subscriptionId);
        expect(wrpc.streamInClosingState.get(subscriptionId.token)).toEqual(token);
        ws.dispatchEvent(
          new MessageEvent('message', {
            data: stringifyMessage({ token, status: EOF_STATUS, error: EOF }),
          }),
        );

        expect(wrpc.streamInClosingState).not.toContain(token);
        expect(closeCallback).toHaveBeenCalledTimes(1);
        expect(closeCallback).toHaveBeenCalledWith(
          EOF,
          undefined,
          EOF_STATUS,
          token,
          requestContext,
        );
        expect(callbackSpy).not.toHaveBeenCalled();
        expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
        expect(eventsEmitterSpy).toHaveBeenCalledWith(token, EOF, undefined, EOF_STATUS);
        expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(1);
        expect(eventsEmitterUnbindSpy).toHaveBeenCalledWith(
          subscriptionId.token,
          subscriptionId.callback,
        );
        expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
        expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
          token,
          requestContext,
          expect.any(Function),
        );
      }
      expect(token).not.toBeNull();
    });

    test(`'${fn} + ${command}' should remove stream from closing map when any error is received`, () => {
      const token = wrpc.closeStream(subscriptionId, closeCallback);

      if (token) {
        const requestContext = createRequestContext(CLOSE, token, subscriptionId);
        expect(wrpc.streamInClosingState.get(subscriptionId.token)).toEqual(token);
        ws.dispatchEvent(
          new MessageEvent('message', {
            data: stringifyMessage({ token, error: ERROR_MESSAGE, status: ERROR_STATUS }),
          }),
        );

        expect(wrpc.streamInClosingState).not.toContain(token);
        expect(closeCallback).toHaveBeenCalledTimes(1);
        expect(closeCallback).toHaveBeenCalledWith(
          ERROR_MESSAGE,
          undefined,
          ERROR_STATUS,
          token,
          requestContext,
        );
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
        expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
          token,
          requestContext,
          expect.any(Function),
        );
      }
      expect(token).not.toBeNull();
    });

    test(`'${fn} + ${command}' should reopen a stream if a stream with the same token is requested while closing`, () => {
      const token = wrpc.closeStream(subscriptionId, closeCallback);

      expect(wrpc.streamInClosingState.get(subscriptionId.token)).toEqual(token);
      const subscriptionIdNew = commandFn.call(wrpc, command, query, callbackSpyTwo);

      if (token && subscriptionIdNew && subscriptionIdNew.token) {
        const requestContext = createRequestContext(command, subscriptionIdNew.token, query);
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
            command,
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
          requestContext,
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
          requestContext,
        );
      }
      expect(token).not.toBeNull();
      expect(subscriptionIdNew).not.toBeNull();
    });
  });

  describe('multiple streams', () => {
    test(`'${fn} + ${command}' should send close message`, () => {
      const streams = [subscriptionId, subscriptionIdTwo];
      const token = wrpc.closeStreams(streams, closeCallback);

      if (token) {
        const requestContext = createRequestContext(CLOSE, token, streams);
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
        expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
          token,
          requestContext,
          expect.any(Function),
        );
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

    test(`'${fn} + ${command}' should callback with error on close message that throws a send error`, () => {
      sendSpy.mockImplementation(() => {
        throw ERROR_MESSAGE;
      });

      const streams = [subscriptionId, subscriptionIdTwo];
      const token = wrpc.closeStreams(streams, closeCallback);

      if (token) {
        const requestContext = createRequestContext(CLOSE, token, streams);
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
        expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
          token,
          requestContext,
          expect.any(Function),
        );
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

    test(`'${fn} + ${command}' should not send close stream message if no streams are present`, () => {
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

    test(`'${fn} + ${command}' should remove stream from closing map when EOF is received`, () => {
      const streams = [subscriptionId, subscriptionIdTwo];
      const token = wrpc.closeStreams(streams, closeCallback);

      if (token) {
        const requestContext = createRequestContext(CLOSE, token, streams);
        expect(wrpc.streamInClosingState.get(subscriptionId.token)).toEqual(token);
        ws.dispatchEvent(
          new MessageEvent('message', {
            data: stringifyMessage({ token, status: EOF_STATUS, error: EOF }),
          }),
        );

        expect(wrpc.streamInClosingState).not.toContain(token);
        expect(closeCallback).toHaveBeenCalledTimes(1);
        expect(closeCallback).toHaveBeenCalledWith(
          EOF,
          undefined,
          EOF_STATUS,
          token,
          requestContext,
        );
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
        expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
          token,
          requestContext,
          expect.any(Function),
        );
      }
      expect(token).not.toBeNull();
    });

    test(`'${fn} + ${command}' should remove stream from closing map when any error is received`, () => {
      const streams = [subscriptionId, subscriptionIdTwo];
      const token = wrpc.closeStreams(streams, closeCallback);

      if (token) {
        const requestContext = createRequestContext(CLOSE, token, streams);
        expect(wrpc.streamInClosingState.get(subscriptionId.token)).toEqual(token);
        ws.dispatchEvent(
          new MessageEvent('message', {
            data: stringifyMessage({ token, error: ERROR_MESSAGE, status: ERROR_STATUS }),
          }),
        );

        expect(wrpc.streamInClosingState).not.toContain(token);
        expect(closeCallback).toHaveBeenCalledTimes(1);
        expect(closeCallback).toHaveBeenCalledWith(
          ERROR_MESSAGE,
          undefined,
          ERROR_STATUS,
          token,
          requestContext,
        );
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
        expect(eventsEmitterBindSpy).toHaveBeenCalledWith(
          token,
          requestContext,
          expect.any(Function),
        );
      }
      expect(token).not.toBeNull();
    });

    test(`'${fn} + ${command}' should reopen a stream if a stream with the same token is requested while closing`, () => {
      const streams = [subscriptionId, subscriptionIdTwo];
      const token = wrpc.closeStreams(streams, closeCallback);

      expect(wrpc.streamInClosingState.get(subscriptionId.token)).toEqual(token);
      const subscriptionIdNew = commandFn.call(wrpc, command, query, callbackSpyTwo);

      if (token && subscriptionIdNew && subscriptionIdNew.token) {
        const requestContext = createRequestContext(command, subscriptionIdNew.token, query);
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
            command,
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
          requestContext,
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
          requestContext,
        );
      }
      expect(token).not.toBeNull();
      expect(subscriptionIdNew).not.toBeNull();
    });
  });
});

describe('enableOptions', () => {
  let wrpc: Wrpc;
  let ws: WebSocket;
  let sendSpy: jest.SpyInstance;
  let eventsEmitterSpy: jest.SpyInstance;
  const ERROR_MESSAGE = 'error';
  const ERROR_STATUS: CloudVisionStatus = {
    code: 3,
    message: ERROR_MESSAGE,
  };
  const PAUSE_STATUS: CloudVisionStatus = {
    code: PAUSED_CODE,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    wrpc = new Wrpc({
      pauseStreams: true,
      batchResults: true,
      debugMode: false,
    });
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
