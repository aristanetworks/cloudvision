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

import { toBinaryKey } from '../src';
import { DEFAULT_CONTEXT, GET } from '../src/constants';
import Emitter from '../src/emitter';
import { EventCallback, RequestContext } from '../types';

describe('Emitter', () => {
  const requestContext: RequestContext = {
    command: GET,
    token: 'Best Team',
    encodedParams: toBinaryKey('Dodgers'),
  };

  test('should remove itself from callback during emit', () => {
    const emitter = new Emitter();
    const event = 'test';
    const data = 'lol';
    const fakeCallback1 = jest.fn();
    const fakeCallback2 = jest.fn();
    const fakeCallbackInner = jest.fn();
    const callbackWithUnbind: EventCallback = (_rq, d) => {
      emitter.unbind(event, callbackWithUnbind);
      fakeCallbackInner(d);
    };

    emitter.bind(event, requestContext, fakeCallback1);
    emitter.bind(event, requestContext, callbackWithUnbind);
    emitter.bind(event, requestContext, fakeCallback2);

    expect(emitter.getEventsMap().get(event)).toHaveLength(3);

    emitter.emit(event, data);

    expect(fakeCallback1).toHaveBeenCalledWith(requestContext, data);
    expect(fakeCallbackInner).toHaveBeenCalledWith(data);
    expect(fakeCallback2).toHaveBeenCalledWith(requestContext, data);

    expect(emitter.getEventsMap().get(event)).toHaveLength(2);
    expect(emitter.getEventsMap().get(event)).toContain(fakeCallback1);
    expect(emitter.getEventsMap().get(event)).toContain(fakeCallback2);
    expect(emitter.getEventsMap().get(event)).not.toContain(callbackWithUnbind);
  });

  test('should delete the event and request entry, if there is only one', () => {
    const emitter = new Emitter();
    const event = 'test';
    const data = 'lol';
    const fakeCallbackInner = jest.fn();
    const callbackWithUnbind: EventCallback = (_rq, d) => {
      emitter.unbind(event, callbackWithUnbind);
      fakeCallbackInner(d);
    };

    emitter.bind(event, requestContext, callbackWithUnbind);

    expect(emitter.getEventsMap().get(event)).toHaveLength(1);
    expect(emitter.getRequestContextMap().get(event)).toEqual(requestContext);

    emitter.emit(event, data);

    expect(fakeCallbackInner).toHaveBeenCalledWith(data);
    expect(emitter.getEventsMap().get(event)).toBe(undefined);
    expect(emitter.getRequestContextMap().get(event)).toBe(undefined);
  });

  test('should not unbind if callack or remove request data is not present', () => {
    const emitter = new Emitter();
    const event = 'test';
    const fakeCallback = jest.fn();
    const fakeCallback2 = jest.fn();

    emitter.bind(event, requestContext, fakeCallback);
    emitter.unbind(event, fakeCallback2);

    expect(emitter.getEventsMap().get(event)).toHaveLength(1);
    expect(emitter.getRequestContextMap().get(event)).toEqual(requestContext);
  });

  test('should not unbind if event type or remove request data is not present', () => {
    const emitter = new Emitter();
    const event = 'test';
    const fakeCallback = jest.fn();

    emitter.bind(event, requestContext, fakeCallback);
    emitter.unbind('test2', fakeCallback);

    expect(emitter.getEventsMap().get(event)).toHaveLength(1);
    expect(emitter.getRequestContextMap().get(event)).toEqual(requestContext);
  });

  test('should unbind if callack is present and remove request data', () => {
    const emitter = new Emitter();
    const event = 'test';
    const fakeCallback = jest.fn();

    emitter.bind(event, requestContext, fakeCallback);
    emitter.unbind(event, fakeCallback);

    expect(emitter.getEventsMap().get(event)).toBe(undefined);
    expect(emitter.getRequestContextMap().get(event)).toBe(undefined);
  });

  test('should unbind if callack is present and but not remove shared request data', () => {
    const emitter = new Emitter();
    const event = 'test';
    const fakeCallback = jest.fn();
    const fakeCallback2 = jest.fn();

    emitter.bind(event, requestContext, fakeCallback);
    emitter.bind(event, requestContext, fakeCallback2);
    expect(emitter.getEventsMap().get(event)).toHaveLength(2);

    emitter.unbind(event, fakeCallback);

    expect(emitter.getEventsMap().get(event)).toHaveLength(1);
    expect(emitter.getRequestContextMap().get(event)).toEqual(requestContext);
  });

  test('`getRequestContextMap` should return request context', () => {
    const emitter = new Emitter();
    const event = 'test';
    const event2 = 'test2';
    const fakeCallbackInner = jest.fn();
    const fakeCallback1 = jest.fn();
    const callbackWithUnbind: EventCallback = (_rq, d) => {
      emitter.unbind(event, callbackWithUnbind);
      fakeCallbackInner(d);
    };

    emitter.bind(event, requestContext, callbackWithUnbind);
    emitter.bind(event2, requestContext, fakeCallback1);

    // @ts-expect-error Accessing private attribute for easier testing
    expect(emitter.events.size).toBe(2);
    expect(emitter.getRequestContextMap().size).toBe(2);
  });

  test('`getEventsMap` should return events', () => {
    const emitter = new Emitter();
    const event = 'test';
    const event2 = 'test2';
    const fakeCallbackInner = jest.fn();
    const fakeCallback1 = jest.fn();
    const callbackWithUnbind: EventCallback = (_rq, d) => {
      emitter.unbind(event, callbackWithUnbind);
      fakeCallbackInner(d);
    };

    emitter.bind(event, requestContext, callbackWithUnbind);
    emitter.bind(event2, requestContext, fakeCallback1);

    // @ts-expect-error Accessing private attribute for easier testing
    expect(emitter.events.size).toBe(2);
    expect(emitter.getEventsMap().size).toBe(2);
  });

  test('should clear all events and request data for eventType on `unbindAll`', () => {
    const emitter = new Emitter();
    const event = 'test';
    const event2 = 'test2';
    const fakeCallbackInner = jest.fn();
    const fakeCallback1 = jest.fn();
    const fakeCallback2 = jest.fn();
    const callbackWithUnbind: EventCallback = (_rq, d) => {
      emitter.unbind(event, callbackWithUnbind);
      fakeCallbackInner(d);
    };

    emitter.bind(event, requestContext, callbackWithUnbind);
    emitter.bind(event, requestContext, fakeCallback2);
    emitter.bind(event2, requestContext, fakeCallback1);
    expect(emitter.getEventsMap().get(event)).toHaveLength(2);
    expect(emitter.getEventsMap().size).toBe(2);
    expect(emitter.getRequestContextMap().get(event)).toEqual(requestContext);

    emitter.unbindAll(event);

    expect(emitter.getEventsMap().get(event)).toBe(undefined);
    expect(emitter.getEventsMap().size).toBe(1);
    expect(emitter.getRequestContextMap().get(event)).toBe(undefined);
  });

  test('should not emit eventType if no callbacks present', () => {
    const emitter = new Emitter();
    const event = 'test';
    const fakeCallback1 = jest.fn();

    emitter.bind(event, requestContext, fakeCallback1);
    emitter.emit('test1');

    expect(fakeCallback1).not.toHaveBeenCalled();
  });

  test('should include request context in emit', () => {
    const emitter = new Emitter();
    const event = 'test';
    const otherArg = 'something';
    const fakeCallback = jest.fn();
    const fakeCallback1 = jest.fn();

    emitter.bind(event, requestContext, fakeCallback);
    emitter.bind(event, requestContext, fakeCallback1);

    emitter.emit(event, otherArg);
    expect(fakeCallback).toHaveBeenCalledWith(requestContext, otherArg);

    emitter.emit(event);
    expect(fakeCallback).toHaveBeenCalledWith(requestContext);
  });

  test('should include default request context in emit, if none is found', () => {
    const emitter = new Emitter();
    const event = 'test';
    const otherArg = 'something';
    const fakeCallback = jest.fn();
    const fakeCallback1 = jest.fn();

    // @ts-expect-error setup for callback that is missing request context
    emitter.bind(event, undefined, fakeCallback);
    // @ts-expect-error setup for callback that is missing request context
    emitter.bind(event, undefined, fakeCallback1);

    emitter.emit(event, otherArg);
    expect(fakeCallback).toHaveBeenCalledWith(DEFAULT_CONTEXT, otherArg);

    emitter.emit(event);
    expect(fakeCallback).toHaveBeenCalledWith(DEFAULT_CONTEXT);
  });

  test('should clear events `Map` on close', () => {
    const emitter = new Emitter();
    const event = 'test';
    const fakeCallback1 = jest.fn();

    emitter.bind(event, requestContext, fakeCallback1);
    emitter.close();

    expect(emitter.getEventsMap().get(event)).toBe(undefined);
    expect(emitter.getEventsMap().size).toBe(0);
  });

  test('should clear requestContext `Map` on close', () => {
    const emitter = new Emitter();
    const event = 'test';
    const fakeCallback1 = jest.fn();

    emitter.bind(event, requestContext, fakeCallback1);
    emitter.close();

    expect(emitter.getRequestContextMap().get(event)).toBe(undefined);
  });

  test('should return true if `has` is called with a callback present in the emitter', () => {
    const emitter = new Emitter();
    const event = 'test';
    const fakeCallback1 = jest.fn();

    emitter.bind(event, requestContext, fakeCallback1);
    expect(emitter.has(event)).toBe(true);
  });

  test('should return false if `has` is called without a callback present in the emitter', () => {
    const emitter = new Emitter();
    const event = 'test';
    expect(emitter.has(event)).toBe(false);

    const fakeCallback1 = jest.fn();
    emitter.bind(event, requestContext, fakeCallback1);
    emitter.close();
    expect(emitter.has(event)).toBe(false);
  });
});
