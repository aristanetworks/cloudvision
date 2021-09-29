// A setup script to load a mock websocket for tests

import { WebSocket } from 'mock-socket';
import util from 'util';

// TextDecoder implementation that matches the lib dom API
class TextDE {
  private decoder = new util.TextDecoder();

  public readonly encoding = 'utf-8';

  public readonly fatal = false;

  public readonly ignoreBOM = true;

  public decode(input?: Uint8Array): string {
    return this.decoder.decode(input);
  }
}

// @ts-expect-error url field of constructor needs URL type
global.WebSocket = WebSocket;

global.TextDecoder = TextDE;
global.TextEncoder = util.TextEncoder;

const swallowError = (): void => undefined;

/* eslint-disable no-console */
console.error = swallowError;
console.warn = swallowError;
/* eslint-enable no-console */
