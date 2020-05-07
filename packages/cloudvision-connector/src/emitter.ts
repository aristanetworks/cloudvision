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

import { EventCallback, RequestArgs } from '../types';
import { EmitterEvents, EmitterRequestArgs } from '../types/emitter';

/**
 * A class that tracks event callbacks by event type.
 * Callbacks get triggered, when an **emit** event is invoked for a given
 * event type.
 */
class Emitter {
  private events: EmitterEvents;

  private requestArgs: EmitterRequestArgs;

  public constructor() {
    this.events = new Map();
    this.requestArgs = new Map();
  }

  /**
   * Returns the `Map` of events
   */
  public getEventsMap(): EmitterEvents {
    return this.events;
  }

  /**
   * Returns the `Map` of requestArgs
   */
  public getRequestArgsMap(): EmitterRequestArgs {
    return this.requestArgs;
  }

  /**
   * Returns true if and only if the emitter has callback(s) of the event type
   */
  public has(eventType: string): boolean {
    return this.events.has(eventType);
  }

  /**
   * Adds the given callback to the event type.
   *
   * @returns The number of callbacks subscribed to the event type
   */
  public bind(eventType: string, requestArgs: RequestArgs, callback: EventCallback): number {
    let callbacksForEvent = this.events.get(eventType);
    if (callbacksForEvent) {
      callbacksForEvent.push(callback);
    } else {
      callbacksForEvent = [callback];
      this.events.set(eventType, callbacksForEvent);
      this.requestArgs.set(eventType, requestArgs);
    }

    return callbacksForEvent.length;
  }

  /**
   * Removes the given callback from the event type.
   * If this is the last callback subscribed to the given event type, then
   * the event type is removed from the `Map` of events.
   *
   * @returns The number of callbacks subscribed to the event type, or null
   * if the callback is not present in the `Map` of events.
   */
  public unbind(eventType: string, callback: EventCallback): number | null {
    const callbacksForEvent = this.events.get(eventType);
    if (!callbacksForEvent) {
      return null;
    }

    const callbackIndex: number = callbacksForEvent.indexOf(callback);
    if (callbackIndex !== -1) {
      callbacksForEvent.splice(callbackIndex, 1);
      this.events.set(eventType, callbacksForEvent);
    }

    const callbacksForEventLen: number = callbacksForEvent.length;

    if (callbacksForEventLen === 0) {
      this.events.delete(eventType);
      this.requestArgs.delete(eventType);
    }

    return callbacksForEventLen;
  }

  /**
   * Removes all callbacks for the given event.
   * This removes the event type from the `Map` of events.
   */
  public unbindAll(eventType: string): void {
    this.events.delete(eventType);
    this.requestArgs.delete(eventType);
  }

  /**
   * Triggers all callbacks bound to the given event type. The function can
   * take extra arguments, which are passed to the callback functions.
   */
  public emit(eventType: string, ...args: unknown[]): void {
    const callbacksForEvent = this.events.get(eventType);
    if (!callbacksForEvent) {
      return;
    }

    // iterate in reverse order in case callback calls unbind on the eventType
    for (let i = callbacksForEvent.length - 1; i >= 0; i -= 1) {
      callbacksForEvent[i](this.requestArgs.get(eventType), ...args);
    }
  }

  /**
   * Unbinds all callbacks for all events.
   * This clears the `Map` of events.
   */
  public close(): void {
    this.events.clear();
    this.requestArgs.clear();
  }
}

export default Emitter;
