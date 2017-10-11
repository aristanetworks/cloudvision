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
  EOF_CODE,
  EOF,
  GET,
  SEARCH,
  SUBSCRIBE,
  PAUSED_CODE,
  RESUME,
} from '../src/constants';
import { makeToken } from '../src/utils';
import WRPC from '../src/wrpc';

const EOF_STATUS = {
  code: EOF_CODE,
};

const ACTIVE_STATUS = {
  code: ACTIVE_CODE,
  messages: 'Active',
};

const ERROR_STATUS = {
  code: 3,
  messages: 'error',
};

const PAUSED_STATUS = {
  code: PAUSED_CODE,
  messages: '',
};

const wsMessage = {
  token: '6shgsdg21das',
  result: '{}',
};

const wsError = {
  token: '456dshgs1das',
  error: 'Some Error',
  status: ERROR_STATUS,
};

describe('WRPC', () => {
  let wrpc;
  let ws;

  beforeEach(() => {
    wrpc = new WRPC();
  });

  test(
    'updates opening and closing websocket connection correctly',
    () => {
      ws = {
        send: (data) => {
          const msg = JSON.parse(data);
          ws.onmessage({
            data: JSON.stringify({ token: msg.token }),
          });
        },
      };
      const connectionCallback1 = jest.fn();
      const connectionCallback2 = jest.fn();
      wrpc.runWithWs(ws);
      const close1 = wrpc.connection(connectionCallback1);
      const close2 = wrpc.connection(connectionCallback2);
      const openEvent = new Event('opened');
      const closeEvent = new Event('closed');
      ws.onopen(openEvent);
      expect(wrpc.isRunning).toBe(true);
      expect(connectionCallback1).toHaveBeenCalledWith(WRPC.CONNECTED, openEvent);
      expect(connectionCallback2).toHaveBeenCalledWith(WRPC.CONNECTED, openEvent);
      ws.onclose(closeEvent);
      expect(wrpc.isRunning).toBe(false);
      expect(connectionCallback1).toHaveBeenCalledWith(WRPC.DISCONNECTED, closeEvent);
      expect(connectionCallback2).toHaveBeenCalledWith(WRPC.DISCONNECTED, closeEvent);

      connectionCallback2.mockClear();
      close2();
      ws.onopen(openEvent);

      expect(wrpc.isRunning).toBe(true);
      expect(connectionCallback1).toHaveBeenCalledWith(WRPC.CONNECTED, openEvent);
      expect(connectionCallback2).not.toHaveBeenCalledWith(WRPC.CONNECTED, openEvent);
      close1();
    },
  );

  test('should create a WebSocket on `run`', () => {
    const url = 'ws://mywebsocket/';
    wrpc.run(url);

    expect(wrpc.ws.url).toBe(url);
    expect(wrpc.ws).toBeInstanceOf(WebSocket);
  });
});

describe('runWithWs', () => {
  let wrpc;

  beforeEach(() => {
    wrpc = new WRPC();
  });

  test('should emit connection event if WS not open', () => {
    const connectionEventsEmitSpy = jest.spyOn(wrpc.connectionEvents, 'emit');
    wrpc.runWithWs(WebSocket);
    const onopenSpy = jest.spyOn(wrpc.ws, 'onopen');
    const openEvent = new Event('opened');

    wrpc.ws.onopen(openEvent);

    expect(onopenSpy).toHaveBeenCalledTimes(1);
    expect(connectionEventsEmitSpy).toHaveBeenCalledTimes(1);
    expect(connectionEventsEmitSpy).toHaveBeenCalledWith('connection', WRPC.CONNECTED, openEvent);
    expect(wrpc.isRunning).toBe(true);
  });

  test('should not emit connection event if WS open', () => {
    const connectionEventsEmitSpy = jest.spyOn(wrpc.connectionEvents, 'emit');
    wrpc.runWithWs(WebSocket);
    const onopenSpy = jest.spyOn(wrpc.ws, 'onopen');
    const openEvent = new Event('opened');

    wrpc.ws.onopen(openEvent);
    expect(onopenSpy).toHaveBeenCalledTimes(1);
    wrpc.ws.onopen(openEvent);

    expect(onopenSpy).toHaveBeenCalledTimes(2);
    expect(connectionEventsEmitSpy).toHaveBeenCalledTimes(1);
    expect(connectionEventsEmitSpy).toHaveBeenCalledWith('connection', WRPC.CONNECTED, openEvent);
    expect(wrpc.isRunning).toBe(true);
  });

  test('should not emit connection event if WS is closed', () => {
    const connectionEventsEmitSpy = jest.spyOn(wrpc.connectionEvents, 'emit');
    wrpc.runWithWs(WebSocket);
    const oncloseSpy = jest.spyOn(wrpc.ws, 'onclose');
    const closeEvent = new Event('closed');

    wrpc.isRunning = true;
    wrpc.ws.onclose(closeEvent);

    expect(oncloseSpy).toHaveBeenCalledTimes(1);
    expect(connectionEventsEmitSpy).toHaveBeenCalledTimes(1);
    expect(connectionEventsEmitSpy).toHaveBeenCalledWith(
      'connection',
      WRPC.DISCONNECTED,
      closeEvent,
    );
    expect(wrpc.isRunning).toBe(false);
  });

  test('should emit message when WS recieves a proper message', () => {
    const eventsEmitterSpy = jest.spyOn(wrpc.eventsEmitter, 'emit');
    wrpc.runWithWs(WebSocket);
    const onmessageSpy = jest.spyOn(wrpc.ws, 'onmessage');

    wrpc.ws.onmessage({ data: JSON.stringify(wsMessage) });

    expect(onmessageSpy).toHaveBeenCalledTimes(1);
    expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
    expect(eventsEmitterSpy).toHaveBeenCalledWith(
      wsMessage.token,
      null,
      wsMessage.result,
      undefined,
    );
  });

  test(
    'should cache the message when WS recieves a proper message',
    () => {
      const setFrameSpy = jest.spyOn(wrpc, 'setFrame');
      wrpc.runWithWs(WebSocket);
      const onmessageSpy = jest.spyOn(wrpc.ws, 'onmessage');

      wrpc.ws.onmessage({ data: JSON.stringify(wsMessage) });

      expect(onmessageSpy).toHaveBeenCalledTimes(1);
      expect(setFrameSpy).toHaveBeenCalledTimes(1);
      expect(setFrameSpy).toHaveBeenCalledWith(
        wsMessage.token,
        { result: wsMessage.result, status: undefined },
      );
    },
  );

  test(
    'should not emit message when WS recieves a message that is not a string',
    () => {
      const eventsEmitterSpy = jest.spyOn(wrpc.eventsEmitter, 'emit');
      wrpc.runWithWs(WebSocket);
      const onmessageSpy = jest.spyOn(wrpc.ws, 'onmessage');

      wrpc.ws.onmessage({ data: wsMessage });

      expect(onmessageSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
    },
  );

  test(
    'should cache the message when WS recieves an empty message',
    () => {
      const setFrameSpy = jest.spyOn(wrpc, 'setFrame');
      wrpc.runWithWs(WebSocket);
      const onmessageSpy = jest.spyOn(wrpc.ws, 'onmessage');

      wrpc.ws.onmessage({ data: [] });

      expect(onmessageSpy).toHaveBeenCalledTimes(1);
      expect(setFrameSpy).not.toHaveBeenCalled();
    },
  );

  test(
    'should not emit message when WS recieves a message that is not JSON serializable',
    () => {
      const eventsEmitterSpy = jest.spyOn(wrpc.eventsEmitter, 'emit');
      wrpc.runWithWs(WebSocket);
      const onmessageSpy = jest.spyOn(wrpc.ws, 'onmessage');

      wrpc.ws.onmessage({ data: '{foo: "foo"}' });

      expect(onmessageSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
    },
  );

  test(
    'should not emit message when WS recieves a message without a token',
    () => {
      const eventsEmitterSpy = jest.spyOn(wrpc.eventsEmitter, 'emit');
      wrpc.runWithWs(WebSocket);
      const onmessageSpy = jest.spyOn(wrpc.ws, 'onmessage');

      wrpc.ws.onmessage({ data: JSON.stringify({ ...wsMessage, token: null }) });

      expect(onmessageSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
    },
  );

  test(
    'should not emit message when WS recieves a message that is empty',
    () => {
      const eventsEmitterSpy = jest.spyOn(wrpc.eventsEmitter, 'emit');
      wrpc.runWithWs(WebSocket);
      const onmessageSpy = jest.spyOn(wrpc.ws, 'onmessage');

      wrpc.ws.onmessage({ data: '' });

      expect(onmessageSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterSpy).not.toHaveBeenCalled();
    },
  );

  test('should emit an error message when WS recieves an error', () => {
    const eventsEmitterSpy = jest.spyOn(wrpc.eventsEmitter, 'emit');
    wrpc.runWithWs(WebSocket);
    const onmessageSpy = jest.spyOn(wrpc.ws, 'onmessage');

    wrpc.ws.onmessage({ data: JSON.stringify(wsError) });

    expect(onmessageSpy).toHaveBeenCalledTimes(1);
    expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
    expect(eventsEmitterSpy)
      .toHaveBeenCalledWith(wsError.token, wsError.error, wsError.result, ERROR_STATUS);
  });

  test(
    'should emit encoded message when WS recieves a non simple message',
    () => {
      const eventsEmitterSpy = jest.spyOn(wrpc.eventsEmitter, 'emit');
      wrpc.runWithWs(WebSocket);
      const onmessageSpy = jest.spyOn(wrpc.ws, 'onmessage');
      const fakeCallback = () => {};
      fakeCallback.simple = false;

      wrpc.eventsEmitter.getEventsMap().set(wsMessage.token, [fakeCallback]);
      wrpc.ws.onmessage({ data: JSON.stringify(wsMessage) });

      expect(onmessageSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(eventsEmitterSpy)
        .toHaveBeenCalledWith(wsMessage.token, null, wsMessage.result, undefined);
    },
  );

  test(
    'should autoresume a stream when a paused error code is received',
    () => {
      const sendMessageStub = jest.spyOn(wrpc, 'sendMessage');
      const token = makeToken('paused', {});
      const msg = {
        token,
        status: PAUSED_STATUS,
      };
      const expectedParams = { token };

      wrpc.runWithWs(WebSocket); // eslint-disable-line
      wrpc.isRunning = true;
      wrpc.ws.onmessage({ data: JSON.stringify(msg) });

      expect(sendMessageStub).toHaveBeenCalledTimes(1);
      expect(sendMessageStub.mock.calls[0][1]).toBe(RESUME);
      expect(sendMessageStub.mock.calls[0][2]).toEqual(expectedParams);
    },
  );
});

describe('close', () => {
  let wrpc;

  beforeEach(() => {
    wrpc = new WRPC();
  });

  test('should close emitters and call close on WS close', () => {
    const eventsEmitterSpy = jest.spyOn(wrpc.eventsEmitter, 'close');
    const connectionEmiterSpy = jest.spyOn(wrpc.connectionEvents, 'close');
    const closeSpy = jest.fn();

    wrpc.runWithWs({ close: closeSpy });
    wrpc.close();

    expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
    expect(connectionEmiterSpy).toHaveBeenCalledTimes(1);
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  test('should clear emitter events on WS close', () => {
    const closeSpy = jest.fn();

    wrpc.runWithWs({ close: closeSpy });
    wrpc.close();

    expect(wrpc.connectionEvents.getEventsMap().size).toBe(0);
    expect(wrpc.eventsEmitter.getEventsMap().size).toBe(0);
  });
});

describe('stream', () => {
  let wrpc;
  let ws;

  beforeEach(() => {
    wrpc = new WRPC();
    ws = {
      send: jest.fn(),
    };
    wrpc.runWithWs(ws);
  });

  test('should not run if the socket is not running', () => {
    const callbackSpy = jest.fn();
    wrpc.stream(SUBSCRIBE, {}, callbackSpy);

    expect(wrpc.isRunning).toBe(false);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
    expect(callbackSpy).toHaveBeenCalledWith('Connection is down', null);
  });

  test('should callback error if sendMessage fails', () => {
    const callbackSpy = jest.fn();
    const error = 'error';
    jest.spyOn(wrpc, 'sendMessage').mockImplementation(() => {
      throw error;
    });
    wrpc.isRunning = true;
    wrpc.stream(SUBSCRIBE, {}, callbackSpy);

    expect(wrpc.isRunning).toBe(true);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
    expect(callbackSpy).toHaveBeenCalledWith(error, null);
  });

  test('should sendMessage if this is the first call', () => {
    const callbackSpy = jest.fn();
    const sendMessageStub = jest.spyOn(wrpc, 'sendMessage');
    wrpc.isRunning = true;
    wrpc.stream(SUBSCRIBE, {}, callbackSpy);

    expect(wrpc.isRunning).toBe(true);
    expect(callbackSpy).not.toHaveBeenCalled();
    expect(sendMessageStub).toHaveBeenCalledTimes(1);
  });

  test('should add to activeStreams once the subscription call returns', () => {
    const callbackSpy = jest.fn();
    const sendMessageStub = jest.spyOn(wrpc, 'sendMessage');
    wrpc.isRunning = true;
    wrpc.stream(SUBSCRIBE, {}, callbackSpy);
    const token = makeToken(SUBSCRIBE, {});
    const msg = {
      token,
      status: ACTIVE_STATUS,
    };

    wrpc.ws.onmessage({ data: JSON.stringify(msg) });

    expect(wrpc.isRunning).toBe(true);
    expect(callbackSpy).toHaveBeenCalledWith(null, undefined, ACTIVE_STATUS, token);
    expect(sendMessageStub).toHaveBeenCalledTimes(1);
    expect(wrpc.activeStreams).toContain(token);
  });

  test('should immediately callback if token is in activeStreams', () => {
    const callbackSpy = jest.fn();
    const callbackSpy2 = jest.fn();
    const sendMessageStub = jest.spyOn(wrpc, 'sendMessage');
    wrpc.isRunning = true;
    wrpc.stream(SUBSCRIBE, {}, callbackSpy);
    const token = makeToken(SUBSCRIBE, {});
    const msg = {
      token,
      status: ACTIVE_STATUS,
    };

    wrpc.ws.onmessage({ data: JSON.stringify(msg) });
    expect(callbackSpy).toHaveBeenCalledWith(null, undefined, ACTIVE_STATUS, token);
    expect(wrpc.activeStreams).toContain(token);

    wrpc.stream(SUBSCRIBE, {}, callbackSpy2);

    expect(wrpc.isRunning).toBe(true);
    expect(callbackSpy2).toHaveBeenCalledWith(null, null, { code: ACTIVE_CODE }, token);
    expect(sendMessageStub).toHaveBeenCalledTimes(1);
  });

  test('should not sendMessage if this is not the first call', () => {
    const callbackSpy = jest.fn();
    const sendMessageStub = jest.spyOn(wrpc, 'sendMessage');
    wrpc.isRunning = true;
    wrpc.stream(SUBSCRIBE, {}, callbackSpy);
    wrpc.stream(SUBSCRIBE, {}, callbackSpy);

    expect(wrpc.isRunning).toBe(true);
    expect(callbackSpy).not.toHaveBeenCalled();
    expect(sendMessageStub).toHaveBeenCalledTimes(1);
  });

  test(
    'should callback error if sendMessage on stream close fails',
    () => {
      const eventsEmitterSpy = jest.spyOn(wrpc.eventsEmitter, 'bind');
      const callbackSpy = jest.fn();
      const error = 'error';
      const sendMessageSpy = jest.spyOn(wrpc, 'sendMessage');
      wrpc.isRunning = true;
      const closeFn = wrpc.stream(SUBSCRIBE, {}, callbackSpy);
      const token = makeToken(SUBSCRIBE, {});
      expect(callbackSpy).not.toHaveBeenCalled();
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);

      sendMessageSpy.mockImplementation(() => {
        throw error;
      });
      closeFn();

      expect(wrpc.isRunning).toBe(true);
      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(error, null, undefined, token);
    },
  );

  test('should sendMessage `close` on last stream close', () => {
    const eventsEmitterSpy = jest.spyOn(wrpc.eventsEmitter, 'bind');
    const callbackSpy = jest.fn();
    const sendMessageSpy = jest.spyOn(wrpc, 'sendMessage');
    wrpc.isRunning = true;
    const closeFn1 = wrpc.stream(SUBSCRIBE, {}, callbackSpy);
    const closeFn2 = wrpc.stream(SUBSCRIBE, {}, callbackSpy);
    expect(callbackSpy).not.toHaveBeenCalled();
    expect(eventsEmitterSpy).toHaveBeenCalledTimes(2);
    expect(sendMessageSpy).toHaveBeenCalledTimes(1);
    sendMessageSpy.mockClear();

    closeFn1();
    closeFn2();

    expect(wrpc.isRunning).toBe(true);
    expect(sendMessageSpy).toHaveBeenCalledTimes(1);
  });

  test('should trigger callback when `close` returns', () => {
    const eventsEmitterSpy = jest.spyOn(wrpc.eventsEmitter, 'bind');
    const callbackSpy = jest.fn();
    const sendMessageSpy = jest.spyOn(wrpc, 'sendMessage');
    wrpc.isRunning = true;
    const token = makeToken(SUBSCRIBE, {});

    const closeFn1 = wrpc.stream(SUBSCRIBE, {}, callbackSpy);

    expect(callbackSpy).not.toHaveBeenCalled();
    expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
    expect(sendMessageSpy).toHaveBeenCalledTimes(1);
    sendMessageSpy.mockClear();

    closeFn1();

    expect(eventsEmitterSpy).toHaveBeenCalledWith(token, expect.any(Function));
    expect(wrpc.isRunning).toBe(true);
    expect(sendMessageSpy).toHaveBeenCalledTimes(1);
  });

  test('should trigger `sendMessage` when `close` returns', () => {
    const eventsEmitterSpy = jest.spyOn(wrpc.eventsEmitter, 'bind');
    const callbackSpy = jest.fn();
    const sendMessageSpy = jest.spyOn(wrpc, 'sendMessage');
    wrpc.isRunning = true;
    const token = makeToken(SUBSCRIBE, {});
    const closeParams = {
      [token]: true,
    };
    const closeToken = makeToken('close', closeParams);

    const closeFn1 = wrpc.stream(SUBSCRIBE, {}, callbackSpy);

    expect(callbackSpy).not.toHaveBeenCalled();
    expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
    expect(sendMessageSpy).toHaveBeenCalledTimes(1);
    sendMessageSpy.mockClear();

    closeFn1();

    expect(eventsEmitterSpy).toHaveBeenCalledWith(token, expect.any(Function));
    expect(wrpc.isRunning).toBe(true);
    expect(sendMessageSpy).toHaveBeenCalledTimes(1);
    sendMessageSpy.mockClear();

    wrpc.stream(SUBSCRIBE, {}, callbackSpy);
    const msg = {
      token: closeToken,
      error: EOF,
      status: EOF_STATUS,
    };
    expect(wrpc.waitingStreams.size).toEqual(1);

    wrpc.ws.onmessage({ data: JSON.stringify(msg) });

    expect(sendMessageSpy).toHaveBeenCalledTimes(1);
    expect(wrpc.waitingStreams.size).toEqual(0);
    expect(wrpc.closingStreams.size).toEqual(0);
  });

  test(
    'should remove stream from  `closingStreams` when `close` returns',
    () => {
      const eventsEmitterSpy = jest.spyOn(wrpc.eventsEmitter, 'bind');
      const callbackSpy = jest.fn();
      const sendMessageSpy = jest.spyOn(wrpc, 'sendMessage');
      wrpc.isRunning = true;
      const token = makeToken(SUBSCRIBE, {});
      const closeParams = {
        [token]: true,
      };
      const closeToken = makeToken('close', closeParams);

      const closeFn1 = wrpc.stream(SUBSCRIBE, {}, callbackSpy);

      expect(callbackSpy).not.toHaveBeenCalled();
      expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
      expect(sendMessageSpy).toHaveBeenCalledTimes(1);
      sendMessageSpy.mockClear();

      closeFn1();

      expect(eventsEmitterSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(wrpc.isRunning).toBe(true);
      expect(sendMessageSpy).toHaveBeenCalledTimes(1);
      expect(wrpc.waitingStreams.size).toEqual(0);
      expect(wrpc.closingStreams.size).toEqual(1);
      sendMessageSpy.mockClear();

      const msg = {
        token: closeToken,
        error: EOF,
        status: EOF_STATUS,
      };

      wrpc.ws.onmessage({ data: JSON.stringify(msg) });

      expect(sendMessageSpy).not.toHaveBeenCalled();
      expect(wrpc.closingStreams.size).toEqual(0);
    },
  );

  test('should ignore non `EOF` errors on `close` returns', () => {
    const eventsEmitterSpy = jest.spyOn(wrpc.eventsEmitter, 'bind');
    const callbackSpy = jest.fn();
    const sendMessageSpy = jest.spyOn(wrpc, 'sendMessage');
    wrpc.isRunning = true;
    const token = makeToken(SUBSCRIBE, {});
    const closeParams = {
      [token]: true,
    };
    const closeToken = makeToken('close', closeParams);

    const closeFn1 = wrpc.stream(SUBSCRIBE, {}, callbackSpy);

    expect(callbackSpy).not.toHaveBeenCalled();
    expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
    expect(sendMessageSpy).toHaveBeenCalledTimes(1);
    sendMessageSpy.mockClear();

    closeFn1();

    expect(eventsEmitterSpy).toHaveBeenCalledWith(token, expect.any(Function));
    expect(wrpc.isRunning).toBe(true);
    expect(sendMessageSpy).toHaveBeenCalledTimes(1);
    expect(wrpc.waitingStreams.size).toEqual(0);
    expect(wrpc.closingStreams.size).toEqual(1);
    sendMessageSpy.mockClear();

    const msg = {
      token: closeToken,
      error: 'error',
      status: ERROR_STATUS,
    };

    wrpc.ws.onmessage({ data: JSON.stringify(msg) });

    expect(sendMessageSpy).not.toHaveBeenCalled();
    expect(wrpc.closingStreams.size).toEqual(1);
  });

  test('should not re open stream, if it is not closed yet', () => {
    const eventsEmitterSpy = jest.spyOn(wrpc.eventsEmitter, 'bind');
    const callbackSpy = jest.fn();
    const sendMessageSpy = jest.spyOn(wrpc, 'sendMessage');
    wrpc.isRunning = true;
    const token = makeToken(SUBSCRIBE, {});
    wrpc.closingStreams.set(token, 'closeToken');

    const closeFn1 = wrpc.stream(SUBSCRIBE, {}, callbackSpy);

    expect(callbackSpy).not.toHaveBeenCalled();
    expect(eventsEmitterSpy).toHaveBeenCalledTimes(1);
    expect(sendMessageSpy).not.toHaveBeenCalled();
    expect(wrpc.waitingStreams.size).toBe(1);

    closeFn1();

    expect(sendMessageSpy).toHaveBeenCalledTimes(1);
  });

  test(
    'should trigger callback and unbind streams when an error is received',
    () => {
      const eventsEmitterBindSpy = jest.spyOn(wrpc.eventsEmitter, 'bind');
      const eventsEmitterUnbindSpy = jest.spyOn(wrpc.eventsEmitter, 'unbind');
      const callbackSpy1 = jest.fn();
      const callbackSpy2 = jest.fn();
      const sendMessageSpy = jest.spyOn(wrpc, 'sendMessage');
      const token = makeToken(SUBSCRIBE, {});
      wrpc.isRunning = true;

      const closeFn1 = wrpc.stream(SUBSCRIBE, {}, callbackSpy1);
      expect(callbackSpy1).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(sendMessageSpy).toHaveBeenCalledTimes(1);
      sendMessageSpy.mockClear();
      eventsEmitterBindSpy.mockClear();

      const closeFn2 = wrpc.stream(SUBSCRIBE, {}, callbackSpy2);
      expect(callbackSpy2).not.toHaveBeenCalled();
      expect(eventsEmitterBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(sendMessageSpy).not.toHaveBeenCalled();

      const msg1 = { token, result: [{ dogers: 'Are winning?' }] };
      wrpc.ws.onmessage({ data: JSON.stringify(msg1) });
      expect(callbackSpy1).toHaveBeenCalledWith(null, msg1.result, undefined, token);
      expect(callbackSpy2).toHaveBeenCalledWith(null, msg1.result, undefined, token);
      expect(eventsEmitterUnbindSpy).not.toHaveBeenCalled();

      const msg2 = { token, error: 'error', status: EOF_STATUS };
      wrpc.ws.onmessage({ data: JSON.stringify(msg2) });

      expect(callbackSpy1).toHaveBeenCalledWith(msg2.error, msg2.result, EOF_STATUS, token);
      expect(callbackSpy2).toHaveBeenCalledWith(msg2.error, msg2.result, EOF_STATUS, token);
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(eventsEmitterUnbindSpy).toHaveBeenCalledTimes(2);

      closeFn1();
      closeFn2();
      expect(sendMessageSpy).not.toHaveBeenCalled();
    },
  );
});

describe('unsafeGet', () => {
  let wrpc;

  beforeEach(() => {
    wrpc = new WRPC();
  });

  test('should unbind callback if sendMessage fails', () => {
    const eventsEmitterBindSpy = jest.spyOn(wrpc.eventsEmitter, 'bind');
    const eventsEmitterUnBindSpy = jest.spyOn(wrpc.eventsEmitter, 'unbind');
    const callbackSpy = jest.fn();
    const error = 'error';
    jest.spyOn(wrpc, 'sendMessage').mockImplementation(() => {
      throw error;
    });
    wrpc.isRunning = true;

    const token = wrpc.unsafeGet(GET, {}, callbackSpy);

    expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
    expect(eventsEmitterUnBindSpy).toHaveBeenCalledTimes(1);
    expect(eventsEmitterUnBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
    expect(wrpc.eventsEmitter.getEventsMap().get(token)).toBe(undefined);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
    expect(callbackSpy).toHaveBeenCalledWith(error, null);
  });

  test('should unbind callback on any error', () => {
    const eventsEmitterBindSpy = jest.spyOn(wrpc.eventsEmitter, 'bind');
    const eventsEmitterUnBindSpy = jest.spyOn(wrpc.eventsEmitter, 'unbind');
    const callbackSpy = jest.fn();
    jest.spyOn(wrpc, 'sendMessage').mockReturnValue(true);
    wrpc.isRunning = true;

    const token = wrpc.unsafeGet(GET, {}, callbackSpy);
    wrpc.eventsEmitter.emit(token, 'error', null, ERROR_STATUS);

    expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
    expect(eventsEmitterUnBindSpy).toHaveBeenCalledTimes(1);
    expect(eventsEmitterUnBindSpy).toHaveBeenCalledWith(token, expect.any(Function));
    expect(wrpc.eventsEmitter.getEventsMap().get(token)).toBe(undefined);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
    expect(callbackSpy).toHaveBeenCalledWith('error', null, ERROR_STATUS, token);
  });

  test('should removeFrame on `EOF`', () => {
    const eventsEmitterBindSpy = jest.spyOn(wrpc.eventsEmitter, 'bind');
    const removeFrameSpy = jest.spyOn(wrpc, 'removeFrame');
    const callbackSpy = jest.fn();
    jest.spyOn(wrpc, 'sendMessage').mockReturnValue(true);
    wrpc.isRunning = true;

    const token = wrpc.unsafeGet(GET, {}, callbackSpy);
    wrpc.eventsEmitter.emit(token, EOF, null, EOF_STATUS);

    expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
    expect(removeFrameSpy).toHaveBeenCalledTimes(1);
    expect(removeFrameSpy).toHaveBeenCalledWith(token);
    expect(wrpc.eventsEmitter.getEventsMap().get(token)).toBe(undefined);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
    expect(callbackSpy).toHaveBeenCalledWith(EOF, null, EOF_STATUS, token);
  });

  test('should not remove frame before all callbacks are unbound', () => {
    const eventsEmitterUnBindSpy = jest.spyOn(wrpc.eventsEmitter, 'unbind');
    const removeFrameSpy = jest.spyOn(wrpc, 'removeFrame');
    const callbackSpy = jest.fn();
    const callbackSpy2 = jest.fn();
    jest.spyOn(wrpc, 'sendMessage').mockReturnValue(true);
    wrpc.isRunning = true;

    const token = wrpc.unsafeGet(GET, {}, callbackSpy);
    const token2 = wrpc.unsafeGet(GET, {}, callbackSpy2);

    // Insure that we have 2 callbacks
    expect(token).toBe(token2);
    expect(wrpc.eventsEmitter.getEventsMap().get(token).length).toBe(2);

    // simulate a callback on only one of the callbacks bound to the token
    wrpc.eventsEmitter.getEventsMap().get(token)[0]('error');

    expect(eventsEmitterUnBindSpy).toHaveBeenCalledTimes(1);
    expect(wrpc.eventsEmitter.getEventsMap().get(token).length).toBe(1);
    expect(removeFrameSpy).not.toHaveBeenCalled();
  });

  test('should invoke callback if there are results', () => {
    const eventsEmitterBindSpy = jest.spyOn(wrpc.eventsEmitter, 'bind');
    const eventsEmitterUnBindSpy = jest.spyOn(wrpc.eventsEmitter, 'unbind');
    const callbackSpy = jest.fn();
    const data = 'something';
    jest.spyOn(wrpc, 'sendMessage').mockReturnValue(true);
    wrpc.isRunning = true;

    const token = wrpc.unsafeGet(GET, {}, callbackSpy);
    wrpc.eventsEmitter.emit(token, null, data);

    expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(1);
    expect(eventsEmitterUnBindSpy).not.toHaveBeenCalled();
    expect(wrpc.eventsEmitter.getEventsMap().get(token).length).toBe(1);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
    expect(callbackSpy).toHaveBeenCalledWith(null, data, undefined, token);
  });

  test('should only sendMessage on first get call', () => {
    const eventsEmitterBindSpy = jest.spyOn(wrpc.eventsEmitter, 'bind');
    const callbackSpy = jest.fn();
    const callback2Spy = jest.fn();
    const sendMessageSpy = jest.spyOn(wrpc, 'sendMessage').mockImplementation(() => {});
    wrpc.isRunning = true;

    // Get an example token we can use
    const token = wrpc.unsafeGet(GET, {}, callbackSpy);
    sendMessageSpy.mockClear();
    eventsEmitterBindSpy.mockClear();
    // Add a callback with the same token
    wrpc.eventsEmitter.bind(token, callback2Spy);
    // This should not trigger a sendMessage call, since there is already
    // and active request with the same token
    const token2 = wrpc.unsafeGet(GET, {}, callbackSpy);

    expect(token).toBe(token2);
    expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(2);
    expect(callbackSpy).not.toHaveBeenCalled();
    expect(callback2Spy).not.toHaveBeenCalled();
    expect(sendMessageSpy).not.toHaveBeenCalled();
  });

  test(
    'should callback all cached frames if a request with same token is open',
    () => {
      const eventsEmitterBindSpy = jest.spyOn(wrpc.eventsEmitter, 'bind');
      const callbackSpy = jest.fn();
      const callbackRunningCallSpy = jest.fn();
      const sendMessageSpy = jest.spyOn(wrpc, 'sendMessage').mockImplementation(() => {});
      wrpc.isRunning = true;

      // Get an example token we can use
      const token = wrpc.unsafeGet(GET, {}, callbackSpy);
      sendMessageSpy.mockClear();
      eventsEmitterBindSpy.mockClear();
      // Add a callback with the same token and set something in the frameCache
      const existingFrames = [{
        datasetId: 'Dodgers',
        Notifications: [{
          path: 'the best',
          timestamp: 100,
        }],
      }, {
        datasetId: 'Klayton Kershaw',
        Notifications: [{
          path: 'all time best',
          timestamp: 300,
        }],
      }];
      wrpc.frameCache.set(token, existingFrames);
      wrpc.eventsEmitter.bind(token, callbackRunningCallSpy);
      // This should not trigger a sendMessage call, since there is already
      // and active request with the same token
      const token2 = wrpc.unsafeGet(GET, {}, callbackSpy);

      expect(token).toBe(token2);
      expect(eventsEmitterBindSpy).toHaveBeenCalledTimes(2);
      expect(callbackSpy).toHaveBeenCalledTimes(2);
      expect(callbackRunningCallSpy).not.toHaveBeenCalled();
      expect(sendMessageSpy).not.toHaveBeenCalled();
    },
  );
});

describe('get', () => {
  let wrpc;

  beforeEach(() => {
    wrpc = new WRPC();
  });

  test('should not send message if socket is not running', () => {
    const tokenString = 'tokenString';
    const callbackSpy = jest.fn();
    const unsafeGetSpy = jest.spyOn(wrpc, 'unsafeGet').mockReturnValue(tokenString);

    const token = wrpc.get(GET, {}, callbackSpy);

    expect(callbackSpy).not.toHaveBeenCalled();
    expect(unsafeGetSpy).not.toHaveBeenCalled();
    expect(token).toBe(null);
  });

  test('should send message if socket is running', () => {
    wrpc.isRunning = true;
    const callbackSpy = jest.fn();
    const unsafeGetSpy = jest.spyOn(wrpc, 'unsafeGet');
    const expectedToken = makeToken(GET, {});

    const token = wrpc.get(GET, {}, callbackSpy);

    expect(callbackSpy).toHaveBeenCalledTimes(1);
    expect(unsafeGetSpy).toHaveBeenCalledTimes(1);
    expect(token).toBe(expectedToken);
  });
});

describe('search', () => {
  let wrpc;

  beforeEach(() => {
    wrpc = new WRPC();
  });

  test('should not send message if socket is not running', () => {
    const tokenString = 'tokenString';
    const callbackSpy = jest.fn();
    const unsafeGetSpy = jest.spyOn(wrpc, 'unsafeGet').mockReturnValue(tokenString);

    const token = wrpc.search(SEARCH, {}, callbackSpy);

    expect(callbackSpy).not.toHaveBeenCalled();
    expect(unsafeGetSpy).not.toHaveBeenCalled();
    expect(token).toBe(null);
  });

  test('should send message if socket is running', () => {
    wrpc.isRunning = true;
    const callbackSpy = jest.fn();
    const unsafeGetSpy = jest.spyOn(wrpc, 'unsafeGet');
    const expectedToken = makeToken(SEARCH, {});

    const token = wrpc.search(SEARCH, {}, callbackSpy);

    expect(callbackSpy).toHaveBeenCalledTimes(1);
    expect(unsafeGetSpy).toHaveBeenCalledTimes(1);
    expect(token).toBe(expectedToken);
  });
});

describe('close', () => {
  let wrpc;
  const streamCallback = jest.fn();
  const streamToken = 'DodgerBlue';
  const streamCallback2 = jest.fn();
  const streamToken2 = 'VinScully';

  beforeEach(() => {
    wrpc = new WRPC();
    jest.spyOn(wrpc, 'sendMessage').mockImplementation(() => {});
  });

  afterEach(() => {
    wrpc.sendMessage.mockRestore();
  });

  test('should properly initiate a close for a single stream', () => {
    const expectedCloseParams = { [streamToken]: true };
    const expectedCloseToken = makeToken(CLOSE, expectedCloseParams);
    wrpc.eventsEmitter.bind(streamToken, streamCallback);

    wrpc.closeStream(CLOSE, streamToken, streamCallback);

    expect(streamCallback).not.toHaveBeenCalled();
    expect(wrpc.closingStreams.get(streamToken)).toBe(expectedCloseToken);
    expect(wrpc.sendMessage).toHaveBeenCalledWith(expectedCloseToken, CLOSE, expectedCloseParams);
  });

  test('should properly initiate a close for multiple streams', () => {
    const streamErrorCallback = jest.fn();
    const streams = [
      { token: streamToken, callback: streamCallback },
      { token: streamToken2, callback: streamCallback2 },
    ];
    const expectedCloseParams = { [streamToken]: true, [streamToken2]: true };
    const expectedCloseToken = makeToken(CLOSE, expectedCloseParams);
    wrpc.eventsEmitter.bind(streamToken, streamCallback);
    wrpc.eventsEmitter.bind(streamToken2, streamCallback2);

    wrpc.closeStreams(CLOSE, streams, streamErrorCallback);

    expect(wrpc.closingStreams.get(streamToken)).toBe(expectedCloseToken);
    expect(wrpc.closingStreams.get(streamToken2)).toBe(expectedCloseToken);
    expect(streamErrorCallback).not.toHaveBeenCalled();
    expect(wrpc.sendMessage).toHaveBeenCalledWith(expectedCloseToken, CLOSE, expectedCloseParams);
  });

  test(
    'should not initiate a close for a single stream, if there are still active callbacks',
    () => {
      const anotherCallback = jest.fn();
      wrpc.eventsEmitter.bind(streamToken, streamCallback);
      wrpc.eventsEmitter.bind(streamToken, anotherCallback);

      wrpc.closeStream(CLOSE, streamToken, streamCallback);

      expect(streamCallback).not.toHaveBeenCalled();
      expect(wrpc.closingStreams.get(streamToken)).toBe(undefined);
      expect(wrpc.sendMessage).not.toHaveBeenCalled();
    },
  );

  test(
    'should not initiate a close for multiple streams, if there are still active callbacks',
    () => {
      const streamErrorCallback = jest.fn();
      const streams = [
        { token: streamToken, callback: streamCallback },
        { token: streamToken2, callback: streamCallback2 },
      ];
      const anotherCallback = jest.fn();
      wrpc.eventsEmitter.bind(streamToken, streamCallback);
      wrpc.eventsEmitter.bind(streamToken, anotherCallback);
      wrpc.eventsEmitter.bind(streamToken2, streamCallback2);
      wrpc.eventsEmitter.bind(streamToken2, anotherCallback);

      wrpc.closeStreams(CLOSE, streams, streamErrorCallback);

      expect(wrpc.closingStreams.get(streamToken)).toBe(undefined);
      expect(wrpc.closingStreams.get(streamToken2)).toBe(undefined);
      expect(streamErrorCallback).not.toHaveBeenCalled();
      expect(wrpc.sendMessage).not.toHaveBeenCalled();
    },
  );

  test(
    'should throw an error if the close for a single stream fails',
    () => {
      wrpc.sendMessage.mockImplementation(() => {
        throw new Error('error');
      });
      const expectedCloseParams = { [streamToken]: true };
      const expectedCloseToken = makeToken(CLOSE, expectedCloseParams);
      wrpc.eventsEmitter.bind(streamToken, streamCallback);

      wrpc.closeStream(CLOSE, streamToken, streamCallback);

      expect(streamCallback).toHaveBeenCalledTimes(1);
      expect(wrpc.closingStreams.get(streamToken)).toBe(undefined);
      expect(wrpc.sendMessage).toHaveBeenCalledWith(expectedCloseToken, CLOSE, expectedCloseParams);
    },
  );

  test(
    'should throw an error if the close for multiple streams fails',
    () => {
      wrpc.sendMessage.mockImplementation(() => {
        throw new Error('error');
      });
      const streamErrorCallback = jest.fn();
      const streams = [
        { token: streamToken, callback: streamCallback },
        { token: streamToken2, callback: streamCallback2 },
      ];
      const expectedCloseParams = { [streamToken]: true, [streamToken2]: true };
      const expectedCloseToken = makeToken(CLOSE, expectedCloseParams);
      wrpc.eventsEmitter.bind(streamToken, streamCallback);
      wrpc.eventsEmitter.bind(streamToken2, streamCallback2);

      wrpc.closeStreams(CLOSE, streams, streamErrorCallback);

      expect(wrpc.closingStreams.get(streamToken)).toBe(undefined);
      expect(wrpc.closingStreams.get(streamToken2)).toBe(undefined);
      expect(streamErrorCallback).toHaveBeenCalledTimes(1);
      expect(wrpc.sendMessage).toHaveBeenCalledWith(expectedCloseToken, CLOSE, expectedCloseParams);
    },
  );
});

describe('sendMessage', () => {
  let wrpc;

  beforeEach(() => {
    wrpc = new WRPC();
    wrpc.ws = {
      send: jest.fn(),
    };
  });

  test('should properly invoke `ws.send`', () => {
    const token = '1asdfasd';
    const command = 'command';
    const params = {};
    const expectedMessage = JSON.stringify({
      token, command, params,
    });

    wrpc.sendMessage(token, command, params);

    expect(wrpc.ws.send).toHaveBeenCalledWith(expectedMessage);
  });
});

describe('frameCache', () => {
  let wrpc;

  beforeEach(() => {
    wrpc = new WRPC();
  });

  test(
    'should properly add the WS frame to the frameCache, when empty',
    () => {
      const token = 'DodgerBlue';
      const result = { dogers: 'Are winning' };
      wrpc.setFrame(token, result);

      expect(wrpc.frameCache.get(token)).toEqual([result]);
    },
  );

  test(
    'should properly add the WS frame to the frameCache, when one already exists',
    () => {
      const token = 'DodgerBlue';
      const existingFrame = [{ klaytonKershaw: 'Cy Young winner' }];
      wrpc.frameCache.set(token, existingFrame);
      const result = { dogers: 'Are winning' };
      wrpc.setFrame(token, result);

      expect(wrpc.frameCache.get(token)).toEqual(existingFrame.concat(result));
    },
  );

  test('should get all frames for a token', () => {
    const token = 'DodgerBlue';
    const existingFrame = [{ klaytonKershaw: 'Cy Young winner' }];
    wrpc.frameCache.set(token, existingFrame);

    const allFrames = wrpc.getFrame(token);

    expect(allFrames).toEqual(existingFrame);
  });

  test('should remove all frames for a token', () => {
    const token = 'DodgerBlue';
    const existingFrame = [{ klaytonKershaw: 'Cy Young winner' }];
    wrpc.frameCache.set(token, existingFrame);

    wrpc.removeFrame(token);

    expect(wrpc.getFrame(token)).toEqual(undefined);
  });
});

describe('WRPC debug mode', () => {
  let wrpc;
  let ws;

  beforeEach(() => {
    jest.spyOn(global.window, 'postMessage');
    wrpc = new WRPC();
    ws = {
      send: jest.fn(),
    };
    wrpc.runWithWs(ws);
  });

  afterEach(() => {
    global.window.postMessage.mockRestore();
  });

  test(
    'should `postMessage` to window on `sendMessage` if in debugMode',
    () => {
      wrpc.debugMode = true;

      const token = '1asdfasd';
      const command = 'command';
      const params = {};
      const expectedMessage = {
        token, command, params,
      };
      const expectedPostedMessage = { request: expectedMessage };

      wrpc.sendMessage(token, command, params);

      expect(wrpc.ws.send).toHaveBeenCalledWith(JSON.stringify(expectedMessage));
      expect(global.window.postMessage).toHaveBeenCalledWith(expectedPostedMessage, '*');
    },
  );

  test(
    'should not `postMessage` to window on `sendMessage` when not in debugMode',
    () => {
      const token = '1asdfasd';
      const command = 'command';
      const params = {};
      const expectedMessage = {
        token, command, params,
      };

      wrpc.sendMessage(token, command, params);

      expect(wrpc.ws.send).toHaveBeenCalledWith(JSON.stringify(expectedMessage));
      expect(global.window.postMessage).not.toHaveBeenCalled();
    },
  );

  test(
    'should `postMessage` to window `onmessage` if in debugMode',
    () => {
      wrpc.debugMode = true;
      const msg = { bestTeam: 'Go Dodgers!' };
      const expectedPostedMessage = { response: msg };

      wrpc.ws.onmessage({ data: JSON.stringify(msg) });

      expect(global.window.postMessage).toHaveBeenCalledWith(expectedPostedMessage, '*');
    },
  );

  test(
    'should not `postMessage` to window `onmessage` when not in debugMode',
    () => {
      const msg = { bestTeam: 'Go Dodgers!' };

      wrpc.ws.onmessage({ data: JSON.stringify(msg) });

      expect(global.window.postMessage).not.toHaveBeenCalled();
    },
  );
});

describe('setStreamClosingState, removeStreamClosingState', () => {
  let wrpc;
  const closeToken = 'Baseball';
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
    wrpc = new WRPC();
    jest.spyOn(wrpc, 'sendMessage').mockImplementation(() => {});
  });

  afterEach(() => {
    wrpc.sendMessage.mockRestore();
  });

  test(
    'should properly set the closing state of a stream when it is in the process of closing',
    () => {
      wrpc.setStreamClosingState(streamToken, closeToken);

      expect(wrpc.closingStreams.get(streamToken)).toBe(closeToken);
    },
  );

  test(
    'should properly set the closing state of multiple streams when it is in the process ' +
    'of closing',
    () => {
      const streams = [stream, stream2];
      wrpc.setStreamClosingState(streams, closeToken);

      expect(wrpc.closingStreams.get(stream.token)).toBe(closeToken);
      expect(wrpc.closingStreams.get(stream2.token)).toBe(closeToken);
    },
  );

  test(
    'should properly remove the closing state of a stream when the stream is closed',
    () => {
      wrpc.closingStreams.set(streamToken, closeToken);

      wrpc.removeStreamClosingState(streamToken, closeToken);

      expect(wrpc.closingStreams.get(streamToken)).toBe(undefined);
    },
  );

  test(
    'should properly remove the closing state of multiple streams when the streams are closed',
    () => {
      const streams = [stream, stream2];
      wrpc.closingStreams.set(stream.token, closeToken);
      wrpc.closingStreams.set(stream2.token, closeToken);

      wrpc.removeStreamClosingState(streams, closeToken);

      expect(wrpc.closingStreams.get(stream.token)).toBe(undefined);
      expect(wrpc.closingStreams.get(stream2.token)).toBe(undefined);
    },
  );

  test('should reinitiate waiting streams with the same token', () => {
    const closeCallback = jest.fn();
    const streamArgs = [streamToken, SUBSCRIBE, {}];
    wrpc.closingStreams.set(streamToken, closeToken);
    wrpc.waitingStreams.set(closeToken, [streamArgs]);
    wrpc.eventsEmitter.bind(closeToken, closeCallback);

    wrpc.removeStreamClosingState(streamToken, closeToken);

    expect(wrpc.closingStreams.get(streamToken)).toBe(undefined);
    expect(wrpc.waitingStreams.get(streamToken)).toBe(undefined);
    expect(wrpc.sendMessage).toHaveBeenCalledWith(...streamArgs);
  });

  test(
    'should reinitiate waiting streams with the same token, when closing multiple streams and ' +
    'reopening only one',
    () => {
      const streams = [stream, stream2];
      const closeCallback = jest.fn();
      const streamArgs = [streamToken, SUBSCRIBE, {}];
      wrpc.closingStreams.set(streamToken, closeToken);
      wrpc.closingStreams.set(streamToken2, closeToken);
      wrpc.waitingStreams.set(closeToken, [streamArgs]);
      wrpc.eventsEmitter.bind(closeToken, closeCallback);

      wrpc.removeStreamClosingState(streams, closeToken);

      expect(wrpc.closingStreams.get(stream.token)).toBe(undefined);
      expect(wrpc.closingStreams.get(stream2.token)).toBe(undefined);
      expect(wrpc.waitingStreams.get(streamToken)).toBe(undefined);
      expect(wrpc.sendMessage).toHaveBeenCalledTimes(1);
      expect(wrpc.sendMessage).toHaveBeenCalledWith(...streamArgs);
    },
  );

  test(
    'should reinitiate waiting streams with the same token, when closing multiple streams and ' +
    'reopening them',
    () => {
      const streams = [stream, stream2];
      const closeCallback = jest.fn();
      const streamArgs = [streamToken, SUBSCRIBE, {}];
      const streamArgs2 = [streamToken2, SUBSCRIBE, {}];
      wrpc.closingStreams.set(streamToken, closeToken);
      wrpc.closingStreams.set(streamToken2, closeToken);
      wrpc.waitingStreams.set(closeToken, [streamArgs, streamArgs2]);
      wrpc.eventsEmitter.bind(closeToken, closeCallback);

      wrpc.removeStreamClosingState(streams, closeToken);

      expect(wrpc.closingStreams.get(stream.token)).toBe(undefined);
      expect(wrpc.closingStreams.get(stream2.token)).toBe(undefined);
      expect(wrpc.waitingStreams.get(streamToken)).toBe(undefined);
      expect(wrpc.sendMessage).toHaveBeenCalledTimes(streams.length);
      expect(wrpc.sendMessage).toHaveBeenCalledWith(...streamArgs); // first call
      expect(wrpc.sendMessage).toHaveBeenCalledWith(...streamArgs2); // second call
    },
  );
});

describe('publish', () => {
  let wrpc;

  beforeEach(() => {
    wrpc = new WRPC();
  });

  test('should not run if the socket is not running', () => {
    const callbackSpy = jest.fn();
    wrpc.publish('publish', {}, callbackSpy);

    expect(wrpc.isRunning).toBe(false);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
    expect(callbackSpy).toHaveBeenCalledWith('Connection is down');
  });

  test('should callback error if sendMessage fails', () => {
    const callbackSpy = jest.fn();
    const error = 'error';
    jest.spyOn(wrpc, 'sendMessage').mockImplementation(() => {
      throw error;
    });
    wrpc.isRunning = true;
    wrpc.publish('publish', {}, callbackSpy);

    expect(wrpc.isRunning).toBe(true);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
    expect(callbackSpy).toHaveBeenCalledWith(error);
  });

  test('should sendMessage when called', () => {
    const callbackSpy = jest.fn();
    const sendMessageStub = jest.spyOn(wrpc, 'sendMessage').mockImplementation(() => {});
    wrpc.isRunning = true;
    wrpc.publish('publish', {}, callbackSpy);

    expect(wrpc.isRunning).toBe(true);
    expect(callbackSpy).not.toHaveBeenCalled();
    expect(sendMessageStub).toHaveBeenCalledTimes(1);
  });

  test(
    'should bind callback to eventsEmitter when publish is called',
    () => {
      const publishEmitterSpy = jest.spyOn(wrpc.eventsEmitter, 'bind');
      const callbackSpy = jest.fn();
      const sendMessageSpy = jest.spyOn(wrpc, 'sendMessage').mockImplementation(() => {});
      wrpc.isRunning = true;
      wrpc.publish('publish', {}, callbackSpy);
      const token = makeToken('publish', {});

      expect(callbackSpy).not.toHaveBeenCalled();
      expect(publishEmitterSpy).toHaveBeenCalledTimes(1);
      expect(publishEmitterSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(sendMessageSpy).toHaveBeenCalledTimes(1);
      expect(wrpc.isRunning).toBe(true);
    },
  );

  test('should call publish callback and unbind on any error', () => {
    const ws = {
      send: jest.fn(),
    };
    const callbackSpy = jest.fn();

    wrpc.runWithWs(ws);
    wrpc.isRunning = true;
    wrpc.publish('publish', {}, callbackSpy);
    const token = makeToken('publish', {});
    const publishEmitterUnBindSpy = jest.spyOn(wrpc.eventsEmitter, 'unbind');
    expect(publishEmitterUnBindSpy).not.toHaveBeenCalled();

    const msg = { token, error: 'something', status: { code: 1 } };
    wrpc.ws.onmessage({ data: JSON.stringify(msg) });
    expect(callbackSpy).toHaveBeenCalledTimes(1);
    expect(callbackSpy).toHaveBeenCalledWith('something', { code: 1 });
    expect(publishEmitterUnBindSpy).toHaveBeenCalledTimes(1);
  });

  test(
    'should call publish callback and not unbind on result without error',
    () => {
      const ws = {
        send: jest.fn(),
      };
      const callbackSpy = jest.fn();

      wrpc.runWithWs(ws);
      wrpc.isRunning = true;
      wrpc.publish('publish', {}, callbackSpy);
      const token = makeToken('publish', {});
      const publishEmitterUnBindSpy = jest.spyOn(wrpc.eventsEmitter, 'unbind');
      expect(publishEmitterUnBindSpy).not.toHaveBeenCalled();

      const msg = {
        error: null,
        result: {},
        status: {},
        token,
      };
      wrpc.ws.onmessage({ data: JSON.stringify(msg) });
      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(null, {});
      expect(publishEmitterUnBindSpy).not.toHaveBeenCalled();
    },
  );
});

describe('pause', () => {
  let wrpc;

  beforeEach(() => {
    wrpc = new WRPC();
  });

  test('should not run if the socket is not running', () => {
    const callbackSpy = jest.fn();
    wrpc.pause('pause', {}, callbackSpy);

    expect(wrpc.isRunning).toBe(false);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
    expect(callbackSpy).toHaveBeenCalledWith('Connection is down');
  });

  test('should callback error if sendMessage fails', () => {
    const callbackSpy = jest.fn();
    const error = 'error';
    jest.spyOn(wrpc, 'sendMessage').mockImplementation(() => {
      throw error; // eslint-disable-line no-throw-literal
    });
    wrpc.isRunning = true;
    wrpc.pause('pause', {}, callbackSpy);

    expect(wrpc.isRunning).toBe(true);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
    expect(callbackSpy).toHaveBeenCalledWith(error);
  });

  test('should sendMessage when called', () => {
    const callbackSpy = jest.fn();
    const sendMessageStub = jest.spyOn(wrpc, 'sendMessage').mockImplementation(() => {});
    wrpc.isRunning = true;
    wrpc.pause('pause', {}, callbackSpy);

    expect(wrpc.isRunning).toBe(true);
    expect(callbackSpy).not.toHaveBeenCalled();
    expect(sendMessageStub).toHaveBeenCalledTimes(1);
  });

  test(
    'should bind callback to eventsEmitter when pause is called',
    () => {
      const emitterSpy = jest.spyOn(wrpc.eventsEmitter, 'bind');
      const callbackSpy = jest.fn();
      const sendMessageSpy = jest.spyOn(wrpc, 'sendMessage').mockImplementation(() => {});
      wrpc.isRunning = true;
      wrpc.pause('pause', {}, callbackSpy);
      const token = makeToken('pause', {});

      expect(callbackSpy).not.toHaveBeenCalled();
      expect(emitterSpy).toHaveBeenCalledTimes(1);
      expect(emitterSpy).toHaveBeenCalledWith(token, expect.any(Function));
      expect(sendMessageSpy).toHaveBeenCalledTimes(1);
      expect(wrpc.isRunning).toBe(true);
    },
  );

  test('should call pause callback and unbind on any error', () => {
    const ws = {
      send: jest.fn(),
    };
    const callbackSpy = jest.fn();

    wrpc.runWithWs(ws);
    wrpc.isRunning = true;
    wrpc.pause('pause', {}, callbackSpy);
    const token = makeToken('pause', {});
    const emitterUnBindSpy = jest.spyOn(wrpc.eventsEmitter, 'unbind');
    expect(emitterUnBindSpy).not.toHaveBeenCalled();

    const msg = { token, error: 'something', status: { code: 1 } };
    wrpc.ws.onmessage({ data: JSON.stringify(msg) });
    expect(callbackSpy).toHaveBeenCalledTimes(1);
    expect(callbackSpy).toHaveBeenCalledWith('something', null, { code: 1 });
    expect(emitterUnBindSpy).toHaveBeenCalledTimes(1);
  });

  test(
    'should call pause callback and not unbind on result without error',
    () => {
      const ws = {
        send: jest.fn(),
      };
      const callbackSpy = jest.fn();

      wrpc.runWithWs(ws);
      wrpc.isRunning = true;
      wrpc.pause('pause', {}, callbackSpy);
      const token = makeToken('pause', {});
      const emitterUnBindSpy = jest.spyOn(wrpc.eventsEmitter, 'unbind');
      expect(emitterUnBindSpy).not.toHaveBeenCalled();

      const msg = {
        error: null,
        result: {},
        status: {},
        token,
      };
      wrpc.ws.onmessage({ data: JSON.stringify(msg) });
      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(callbackSpy).toHaveBeenCalledWith(null, null, {});
      expect(emitterUnBindSpy).not.toHaveBeenCalled();
    },
  );
});

describe('enableOptions', () => {
  let wrpc;

  beforeEach(() => {
    wrpc = new WRPC();
    jest.spyOn(wrpc, 'pause');
  });

  test('should call `pause` if connector started with that option enabled', () => {
    const callback = jest.fn();
    wrpc.connectorOptions = { pauseStreams: true };
    wrpc.enableOptions(callback);

    expect(callback).toHaveBeenCalled();
    expect(wrpc.pause).toHaveBeenCalled();
  });

  test('should call `pause` if connector was started with that option disabled', () => {
    const callback = jest.fn();
    wrpc.enableOptions(callback);

    expect(callback).toHaveBeenCalled();
    expect(wrpc.pause).not.toHaveBeenCalled();
  });
});
