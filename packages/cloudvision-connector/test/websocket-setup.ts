// A setup script to load a mock websocket for tests

import { WebSocket } from 'mock-socket';
import util from 'util';

// TextDecoder implementation that matches the lib dom API
class TextDE {
  private decoder = new util.TextDecoder();

  readonly encoding = 'utf-8';

  readonly fatal = false;

  readonly ignoreBOM = true;

  decode(input?: Uint8Array): string {
    return this.decoder.decode(input);
  }
}

// @ts-ignore temp ignore to test
global.WebSocket = WebSocket;

global.TextDecoder = TextDE;
global.TextEncoder = util.TextEncoder;

const swallowError = (): void => undefined;

/* eslint-disable no-console */
console.error = swallowError;
console.warn = swallowError;
/* eslint-enable no-console */
