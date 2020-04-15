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

import Emitter from '../src/emitter';

describe('Emitter', () => {
  test('should remove itself from callback during emit', () => {
    const emitter = new Emitter();
    const event = 'test';
    const data = 'lol';
    const fakeCallback1 = jest.fn();
    const fakeCallback2 = jest.fn();
    const fakeCallbackInner = jest.fn();
    const callbackWithUnbind = (d: string | null) => {
      emitter.unbind(event, callbackWithUnbind);
      fakeCallbackInner(d);
    };

    emitter.bind(event, fakeCallback1);
    emitter.bind(event, callbackWithUnbind);
    emitter.bind(event, fakeCallback2);

    expect(emitter.getEventsMap().get(event)).toHaveLength(3);

    emitter.emit(event, data);

    expect(fakeCallback1).toHaveBeenCalledWith(data);
    expect(fakeCallbackInner).toHaveBeenCalledWith(data);
    expect(fakeCallback2).toHaveBeenCalledWith(data);

    expect(emitter.getEventsMap().get(event)).toHaveLength(2);
    expect(emitter.getEventsMap().get(event)).toContain(fakeCallback1);
    expect(emitter.getEventsMap().get(event)).toContain(fakeCallback2);
    expect(emitter.getEventsMap().get(event)).not.toContain(callbackWithUnbind);
  });

  test('should delete the event entry, if there is only one', () => {
    const emitter = new Emitter();
    const event = 'test';
    const data = 'lol';
    const fakeCallbackInner = jest.fn();
    const callbackWithUnbind = (d: string | null) => {
      emitter.unbind(event, callbackWithUnbind);
      fakeCallbackInner(d);
    };

    emitter.bind(event, callbackWithUnbind);

    expect(emitter.getEventsMap().get(event)).toHaveLength(1);

    emitter.emit(event, data);

    expect(fakeCallbackInner).toHaveBeenCalledWith(data);
    expect(emitter.getEventsMap().get(event)).toBe(undefined);
  });

  test('should not unbind if callack is not present', () => {
    const emitter = new Emitter();
    const event = 'test';
    const fakeCallback = jest.fn();
    const fakeCallback2 = jest.fn();

    emitter.bind(event, fakeCallback);
    emitter.unbind(event, fakeCallback2);

    expect(emitter.getEventsMap().get(event)).toHaveLength(1);
  });

  test('should not unbind if event type is not present', () => {
    const emitter = new Emitter();
    const event = 'test';
    const fakeCallback = jest.fn();

    emitter.bind(event, fakeCallback);
    emitter.unbind('test2', fakeCallback);

    expect(emitter.getEventsMap().get(event)).toHaveLength(1);
  });

  test('should unbind if callack is present', () => {
    const emitter = new Emitter();
    const event = 'test';
    const fakeCallback = jest.fn();

    emitter.bind(event, fakeCallback);
    emitter.unbind(event, fakeCallback);

    expect(emitter.getEventsMap().get(event)).toBe(undefined);
  });

  test('`getEventsMap` should return events', () => {
    const emitter = new Emitter();
    const event = 'test';
    const event2 = 'test2';
    const fakeCallbackInner = jest.fn();
    const fakeCallback1 = jest.fn();
    const callbackWithUnbind = (d: string | null) => {
      emitter.unbind(event, callbackWithUnbind);
      fakeCallbackInner(d);
    };

    emitter.bind(event, callbackWithUnbind);
    emitter.bind(event2, fakeCallback1);

    // @ts-ignore
    expect(emitter.events.size).toBe(2);
    expect(emitter.getEventsMap().size).toBe(2);
  });

  test('should clear all events for eventType on `unbindAll`', () => {
    const emitter = new Emitter();
    const event = 'test';
    const event2 = 'test2';
    const fakeCallbackInner = jest.fn();
    const fakeCallback1 = jest.fn();
    const fakeCallback2 = jest.fn();
    const callbackWithUnbind = (d: string | null) => {
      emitter.unbind(event, callbackWithUnbind);
      fakeCallbackInner(d);
    };

    emitter.bind(event, callbackWithUnbind);
    emitter.bind(event, fakeCallback2);
    emitter.bind(event2, fakeCallback1);
    expect(emitter.getEventsMap().get(event)).toHaveLength(2);
    expect(emitter.getEventsMap().size).toBe(2);

    emitter.unbindAll(event);

    expect(emitter.getEventsMap().get(event)).toBe(undefined);
    expect(emitter.getEventsMap().size).toBe(1);
  });

  test('should not emit eventType if no callbacks present', () => {
    const emitter = new Emitter();
    const event = 'test';
    const fakeCallback1 = jest.fn();

    emitter.bind(event, fakeCallback1);
    emitter.emit('test1');

    expect(fakeCallback1).not.toHaveBeenCalled();
  });

  test('should clear events `Map` on close', () => {
    const emitter = new Emitter();
    const event = 'test';
    const fakeCallback1 = jest.fn();

    emitter.bind(event, fakeCallback1);
    emitter.close();

    expect(emitter.getEventsMap().get(event)).toBe(undefined);
    expect(emitter.getEventsMap().size).toBe(0);
  });

  test('should return true if `has` is called with a callback present in the emitter', () => {
    const emitter = new Emitter();
    const event = 'test';
    const fakeCallback1 = jest.fn();

    emitter.bind(event, fakeCallback1);
    expect(emitter.has(event)).toBe(true);
  });

  test('should return false if `has` is called without a callback present in the emitter', () => {
    const emitter = new Emitter();
    const event = 'test';
    expect(emitter.has(event)).toBe(false);

    const fakeCallback1 = jest.fn();
    emitter.bind(event, fakeCallback1);
    emitter.close();
    expect(emitter.has(event)).toBe(false);
  });
});
