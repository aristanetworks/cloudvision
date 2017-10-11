// A setup script to load a mock websocket for tests

const mockWebSocket = require('mock-socket').WebSocket;

global.WebSocket = mockWebSocket;

global.navigator = {
  userAgent: 'node.js',
};
const swallowError = () => {
};

/* eslint-disable no-console */
console.error = swallowError;
console.warn = swallowError;
/* eslint-enable no-console */
