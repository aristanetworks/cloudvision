/**
 * @jest-environment jsdom
 */

// Copyright (c) 2020, Arista Networks, Inc.
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
  EOF,
  EOF_CODE,
  GET,
  GET_DATASETS,
  PUBLISH,
  SEARCH,
  SEARCH_SUBSCRIBE,
  SERVICE_REQUEST,
  SUBSCRIBE,
} from '../src/constants';
import { toBinaryKey } from '../src/utils';
import {
  CloudVisionParams,
  CloudVisionQueryMessage,
  CloudVisionStatus,
  NotifCallback,
  QueryParams,
  RequestContext,
  StreamCommand,
  WsCommand,
} from '../types';

jest.mock('../src/Parser', () => ({
  parse: (res: string) => JSON.parse(res),
  stringify: (msg: CloudVisionQueryMessage) => JSON.stringify(msg),
}));

jest.mock('../src/logger', () => {
  return { log: jest.fn() };
});

type WrpcMethod = 'get' | 'publish' | 'requestService' | 'search';

interface PolymorphicCommandFunction {
  (command: WsCommand, params: CloudVisionParams, callback: NotifCallback): string;
}

interface CommandFunction {
  (p: CloudVisionParams, cb: NotifCallback): string;
}

const query: QueryParams = { query: [] };

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

describe.each<[WsCommand, WrpcMethod, boolean]>([
  [GET, 'get', true],
  [PUBLISH, 'publish', false],
  [GET_DATASETS, 'get', true],
  [SEARCH, 'search', false],
  [SERVICE_REQUEST, 'requestService', false],
])('Instrumented Call Commands', (command, fn, polymorphic) => {
  let wrpc: Wrpc;
  let ws: WebSocket;
  let sendSpy: jest.SpyInstance;
  let eventsEmitterSpy: jest.SpyInstance;
  let eventsEmitterUnbindSpy: jest.SpyInstance;
  let eventsEmitterBindSpy: jest.SpyInstance;
  let polymorphicCommandFn: PolymorphicCommandFunction;
  let commandFn: CommandFunction;
  const startSpy = jest.fn();
  const infoSpy = jest.fn();
  const endSpy = jest.fn();
  const callbackSpy = jest.fn();
  const ERROR_MESSAGE = 'error';

  beforeEach(() => {
    jest.resetAllMocks();
    wrpc = new Wrpc({
      batchResults: false,
      debugMode: false,
      instrumentationConfig: {
        commands: [GET, PUBLISH, SEARCH, SERVICE_REQUEST, GET_DATASETS],
        start: startSpy,
        info: infoSpy,
        end: endSpy,
      },
      nanosecondMode: false,
    });
    // @ts-expect-error Easier than to type everything
    commandFn = wrpc[fn];
    // @ts-expect-error Easier than to type everything
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
    startSpy.mockClear();
    infoSpy.mockClear();
    endSpy.mockClear();
  });

  test(`'${fn} + ${command}' should not send instrumentation message start if socket is not running`, () => {
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
    expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
    expect(startSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(endSpy).not.toHaveBeenCalled();
    expect(token).toBe(null);
  });

  test(`'${fn} + ${command}' should send instrumentation message start if socket is running`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, command, {}, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    if (token) {
      const requestContext = createRequestContext(command, token, {});
      expect(callbackSpy).not.toHaveBeenCalled();
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
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
          command,
          params: {},
        }),
      );
      expect(token).not.toBeNull();
      expect(startSpy).toHaveBeenCalledWith(requestContext);
      expect(infoSpy).not.toHaveBeenCalled();
      expect(endSpy).not.toHaveBeenCalled();
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${command}' should send instrumentation info message on error`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));
    sendSpy.mockImplementation(() => {
      throw new Error(ERROR_MESSAGE);
    });

    let token;
    if (polymorphic) {
      token = polymorphicCommandFn.call(wrpc, command, {}, callbackSpy);
    } else {
      token = commandFn.call(wrpc, {}, callbackSpy);
    }
    if (token) {
      const requestContext = createRequestContext(command, token, {});
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
        new Error(ERROR_MESSAGE),
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
      expect(startSpy).toHaveBeenCalledWith(requestContext);
      expect(infoSpy).toHaveBeenCalledWith(requestContext, { error: new Error(ERROR_MESSAGE) });
      expect(endSpy).toHaveBeenCalledWith(requestContext);
    }
    expect(token).not.toBeNull();
  });

  test(`'${fn} + ${command}' should send instrumentation end message on EOF`, () => {
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
      expect(startSpy).toHaveBeenCalledWith(requestContext);
      expect(infoSpy).toHaveBeenCalledWith(requestContext, { error: EOF });
      expect(endSpy).toHaveBeenCalledWith(requestContext);
    }
    expect(token).not.toBeNull();
  });
});

describe.each<[StreamCommand, 'stream']>([
  [SUBSCRIBE, 'stream'],
  [SEARCH_SUBSCRIBE, 'stream'],
  [SERVICE_REQUEST, 'stream'],
])('Instrumented Stream Commands', (command, fn) => {
  let wrpc: Wrpc;
  let ws: WebSocket;
  let sendSpy: jest.SpyInstance;
  let eventsEmitterSpy: jest.SpyInstance;
  let eventsEmitterUnbindSpy: jest.SpyInstance;
  let eventsEmitterBindSpy: jest.SpyInstance;
  let commandFn: Wrpc['stream'];
  const callbackSpy = jest.fn();
  const startSpy = jest.fn();
  const infoSpy = jest.fn();
  const endSpy = jest.fn();
  const ACTIVE_STATUS: CloudVisionStatus = { code: ACTIVE_CODE };

  beforeEach(() => {
    jest.resetAllMocks();
    wrpc = new Wrpc({
      batchResults: false,
      debugMode: false,
      instrumentationConfig: {
        commands: [SUBSCRIBE, SERVICE_REQUEST, SEARCH_SUBSCRIBE],
        start: startSpy,
        info: infoSpy,
        end: endSpy,
      },
      nanosecondMode: false,
    });
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
    startSpy.mockClear();
    infoSpy.mockClear();
    endSpy.mockClear();
  });

  test(`'${fn} + ${command}' should not send instrumentation info message if socket is not running`, () => {
    const subscriptionId = commandFn.call(wrpc, command, query, callbackSpy);

    expect(callbackSpy).toHaveBeenCalledWith('Connection is down');
    expect(eventsEmitterSpy).not.toHaveBeenCalled();
    expect(eventsEmitterBindSpy).not.toHaveBeenCalled();
    expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
    expect(subscriptionId).toBe(null);
    expect(startSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(endSpy).not.toHaveBeenCalled();
  });

  test(`'${fn} + ${command}' should send instrumentation info message if socket is running`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const subscriptionId = commandFn.call(wrpc, command, query, callbackSpy);
    if (subscriptionId?.token) {
      const token = subscriptionId.token;
      const requestContext = createRequestContext(command, token, query);
      expect(callbackSpy).not.toHaveBeenCalled();
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
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
          command,
          params: query,
        }),
      );
      expect(subscriptionId).not.toBeNull();
      expect(startSpy).toHaveBeenCalledWith(requestContext);
      expect(infoSpy).not.toHaveBeenCalled();
      expect(endSpy).not.toHaveBeenCalled();
    }
    expect(subscriptionId).not.toBeNull();
  });

  test(`'${fn} + ${command}' should send instrumentation end message on EOF`, () => {
    const EOF_STATUS: CloudVisionStatus = { code: EOF_CODE };
    ws.dispatchEvent(new MessageEvent('open', {}));

    const subscriptionId = commandFn.call(wrpc, command, query, callbackSpy);
    if (subscriptionId?.token) {
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
      expect(startSpy).toHaveBeenCalledWith(requestContext);
      expect(infoSpy).toHaveBeenCalledWith(requestContext, { error: EOF });
      expect(endSpy).toHaveBeenCalledWith(requestContext);
    }
    expect(subscriptionId).not.toBeNull();
  });

  test(`'${fn} + ${command}' should send instrumentation message if ACK message is received`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    const subscriptionId = commandFn.call(wrpc, command, query, callbackSpy);
    if (subscriptionId?.token) {
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
      expect(startSpy).toHaveBeenCalledWith(requestContext);
      expect(infoSpy).toHaveBeenCalledWith(requestContext, { message: 'stream active' });
      expect(endSpy).not.toHaveBeenCalled();
    }
    expect(subscriptionId).not.toBeNull();
  });
});

describe.each<[WsCommand, 'stream' | 'get']>([
  [GET, 'get'],
  [SUBSCRIBE, 'stream'],
  [SEARCH_SUBSCRIBE, 'stream'],
  [SERVICE_REQUEST, 'stream'],
])('Non Instrumented Commands', (command, fn) => {
  let wrpc: Wrpc;
  let ws: WebSocket;
  let sendSpy: jest.SpyInstance;
  let eventsEmitterSpy: jest.SpyInstance;
  let eventsEmitterUnbindSpy: jest.SpyInstance;
  let eventsEmitterBindSpy: jest.SpyInstance;
  let commandFn: Wrpc['stream'];
  const callbackSpy = jest.fn();
  const startSpy = jest.fn();
  const infoSpy = jest.fn();
  const endSpy = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    wrpc = new Wrpc({
      batchResults: false,
      debugMode: false,
      instrumentationConfig: {
        commands: [PUBLISH],
        start: startSpy,
        info: infoSpy,
        end: endSpy,
      },
      nanosecondMode: false,
    });
    // @ts-expect-error Easier than to type everything
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
    startSpy.mockClear();
    infoSpy.mockClear();
    endSpy.mockClear();
  });

  test(`'${fn} + ${command}' should not send instrumentation info message if socket is not running`, () => {
    // @ts-expect-error Easier than to type everything
    const subscriptionId = commandFn.call(wrpc, command, query, callbackSpy);

    expect(callbackSpy).toHaveBeenCalledWith('Connection is down');
    expect(eventsEmitterSpy).not.toHaveBeenCalled();
    expect(eventsEmitterBindSpy).not.toHaveBeenCalled();
    expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
    expect(subscriptionId).toBe(null);
    expect(startSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(endSpy).not.toHaveBeenCalled();
  });

  test(`'${fn} + ${command}' should send instrumentation message if socket is running, but command is not instrumented`, () => {
    ws.dispatchEvent(new MessageEvent('open', {}));

    // @ts-expect-error Easier than to type everything
    const subscriptionId = commandFn.call(wrpc, command, query, callbackSpy);
    if (subscriptionId?.token) {
      const token = subscriptionId.token;
      const requestContext = createRequestContext(command, token, query);
      expect(callbackSpy).not.toHaveBeenCalled();
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();
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
          command,
          params: query,
        }),
      );
      expect(subscriptionId).not.toBeNull();
      expect(startSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
      expect(endSpy).not.toHaveBeenCalled();
    }
    expect(subscriptionId).not.toBeNull();
  });
});
