// A setup script to load a mock websocket for tests

import util from 'util';

const mockWebSocket = require('mock-socket').WebSocket;

global.WebSocket = mockWebSocket;

global.TextDecoder = util.TextDecoder;
global.TextEncoder = util.TextEncoder;

global.navigator = {
  userAgent: 'node.js',
};
const swallowError = (): void => undefined;

/* eslint-disable no-console */
console.error = swallowError;
console.warn = swallowError;
/* eslint-enable no-console */
