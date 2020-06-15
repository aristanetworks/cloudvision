import { fromBinaryKey, toBinaryKey } from 'cloudvision-connector';

import AsyncMessenger, { UNDEFINED_POST_MESSAGE_ERROR } from '..';
import {
  MessageRequest,
  MessageResponse,
  MessageResponseError,
  MessageResponseSuccess,
} from '../types';

type MessagesFromA = {
  INTRODUCE: {
    request: string;
    response: string;
  };
};

type MessagesFromB = {};

// Stub console method
jest.spyOn(console, 'warn').mockImplementation();

let nextReqIndex = 0;

function createRequest<T extends string, D>(type: T, data: D): MessageRequest<T, D> {
  const reqIndex = nextReqIndex;
  nextReqIndex += 1;

  const requestId = `${type}-${reqIndex}`;

  return { data, requestId, type };
}

function createResponse(requestId: string, value: Error): MessageResponseError;
function createResponse<D>(requestId: string, value: D): MessageResponseSuccess<D>;
function createResponse<D>(requestId: string, value: D | Error): MessageResponse<D> {
  return value instanceof Error
    ? {
        error: value.message,
        requestId,
      }
    : {
        data: value,
        requestId,
      };
}

describe('AsyncMessenger', () => {
  describe('constructor', () => {
    test.each([
      ['default encoding', undefined, undefined],
      ['custom encoding', toBinaryKey, fromBinaryKey],
    ])('should send message and receive response with %s', (_message, encoder, decoder) => {
      const messengerA = new AsyncMessenger<MessagesFromA, MessagesFromB>(encoder, decoder);
      const messengerB = new AsyncMessenger<MessagesFromB, MessagesFromA>(encoder, decoder);

      messengerA.setSendMessage((message) => messengerB.receive(message));
      messengerB.setSendMessage((message) => messengerA.receive(message));

      messengerB.addRequestHandler('INTRODUCE', (name) => `Hello ${name}!`);

      const promise = messengerA.send('INTRODUCE', 'Bob');

      return expect(promise).resolves.toBe('Hello Bob!');
    });
  });

  describe('setSendMessage', () => {
    test('should return messenger', () => {
      const messenger = new AsyncMessenger();

      expect(messenger.setSendMessage(jest.fn())).toBe(messenger);
    });
  });

  describe('send', () => {
    let messenger: AsyncMessenger<MessagesFromA, MessagesFromB>;

    beforeEach(() => {
      messenger = new AsyncMessenger();
    });

    test('should reject if no `postMessage` set', () => {
      return expect(messenger.send('INTRODUCE', 'Bob')).rejects.toThrow(
        UNDEFINED_POST_MESSAGE_ERROR,
      );
    });

    test('should resolve with response for resolved message', () => {
      let requestId = '';
      const sendMessage = jest.fn((message) => {
        const request = JSON.parse(message) as MessageRequest<'INTRODUCE', string>;
        requestId = request.requestId;
      });

      messenger.setSendMessage(sendMessage);

      const promise = messenger.send('INTRODUCE', 'Bob');
      expect(sendMessage).toHaveBeenCalled();

      // Mock response
      const response = createResponse(requestId, 'hello');
      messenger.receive(JSON.stringify(response));

      return expect(promise).resolves.toBe(response.data);
    });

    test('should reject with error for rejected message', () => {
      let requestId = '';
      const sendMessage = jest.fn((message) => {
        const request = JSON.parse(message) as MessageRequest<'INTRODUCE', string>;
        requestId = request.requestId;
      });

      messenger.setSendMessage(sendMessage);

      const promise = messenger.send('INTRODUCE', 'Bob');
      expect(sendMessage).toHaveBeenCalled();

      // Mock response
      const error = Error('Error!');
      const response = createResponse(requestId, error);
      messenger.receive(JSON.stringify(response));

      return expect(promise).rejects.toEqual(error);
    });

    test('should reject for unresolved message with timeout', () => {
      messenger.setSendMessage(jest.fn());

      const timeout = 10;
      const promise = messenger.send('INTRODUCE', 'Bob', timeout);

      return expect(promise).rejects.toThrow(`Timeout after ${timeout}ms`);
    });

    test('should resolve with response for resolved message with timeout', () => {
      let requestId = '';
      const sendMessage = jest.fn((message) => {
        const request = JSON.parse(message) as MessageRequest<'INTRODUCE', string>;
        requestId = request.requestId;
      });

      messenger.setSendMessage(sendMessage);

      const timeout = 1000;
      const promise = messenger.send('INTRODUCE', 'Bob', timeout);

      // Mock response
      const response = createResponse(requestId, 'hello');
      messenger.receive(JSON.stringify(response));

      return expect(promise).resolves.toBe(response.data);
    });
  });

  describe('receive', () => {
    let messenger: AsyncMessenger<MessagesFromB, MessagesFromA>;

    beforeEach(() => {
      messenger = new AsyncMessenger();
    });

    describe('request', () => {
      test('should reject if `postMessage` not set', () => {
        const request = createRequest('INTRODUCE', 'Bob');
        const promise = messenger.receive(JSON.stringify(request));

        return expect(promise).rejects.toThrow(UNDEFINED_POST_MESSAGE_ERROR);
      });

      test('should send error response if no handler for message type', async () => {
        let requestId = '';
        const sendMessage = jest.fn((message) => {
          const request = JSON.parse(message) as MessageRequest<'INTRODUCE', string>;
          requestId = request.requestId;
        });
        messenger.setSendMessage(sendMessage);

        // Mock request
        const type = 'BAD_MESSAGE';
        const request = createRequest(type, true);
        await messenger.receive(JSON.stringify(request));

        const expectedResponse: MessageResponseError = {
          error: `No request handler defined for message type "${type}"`,
          requestId,
        };

        return expect(sendMessage).toHaveBeenCalledWith(JSON.stringify(expectedResponse));
      });
    });

    describe('response', () => {
      test('should warn for unexpected request ID', async () => {
        messenger.setSendMessage(jest.fn());

        // Mock request
        const requestId = 'bad request ID';
        const response: MessageResponse<string> = {
          requestId,
          data: 'foo',
        };
        await messenger.receive(JSON.stringify(response));

        // eslint-disable-next-line no-console
        expect(console.warn).toHaveBeenCalledWith(
          `Response for request ID "${requestId}" either timed out or is unexpected`,
        );
      });

      test('should call custom `onWarning` function if passed in constructor', async () => {
        const onWarning = jest.fn();

        const newMessenger = new AsyncMessenger(undefined, undefined, onWarning);

        // Mock request
        const requestId = 'bad request ID';
        const response: MessageResponse<string> = {
          requestId,
          data: 'foo',
        };
        await newMessenger.receive(JSON.stringify(response));

        expect(onWarning).toHaveBeenCalledWith(
          `Response for request ID "${requestId}" either timed out or is unexpected`,
        );
      });
    });
  });

  describe('addRequestHandler', () => {
    let messenger: AsyncMessenger<MessagesFromB, MessagesFromA>;

    beforeEach(() => {
      messenger = new AsyncMessenger();
    });

    test('should resolve request with handler value', async () => {
      let requestId = '';
      const sendMessage = jest.fn((message) => {
        const request = JSON.parse(message) as MessageRequest<'INTRODUCE', string>;
        requestId = request.requestId;
      });
      messenger.setSendMessage(sendMessage);

      // Add handler
      const responseValue = 'foo';
      const handler = jest.fn(() => responseValue);
      messenger.addRequestHandler('INTRODUCE', handler);

      // Mock request
      const requestValue = 'Bob';
      const request = createRequest('INTRODUCE', requestValue);
      await messenger.receive(JSON.stringify(request));

      expect(handler).toHaveBeenCalledWith(requestValue);

      const expectedResponse: MessageResponseSuccess<string> = {
        data: responseValue,
        requestId,
      };
      expect(sendMessage).toHaveBeenCalledWith(JSON.stringify(expectedResponse));
    });

    test('should reject request with handler error', async () => {
      let requestId = '';
      const sendMessage = jest.fn((message) => {
        const request = JSON.parse(message) as MessageRequest<'INTRODUCE', string>;
        requestId = request.requestId;
      });
      messenger.setSendMessage(sendMessage);

      // Add handler
      const error = Error('Error!');
      const handler = jest.fn(() => {
        throw error;
      });
      messenger.addRequestHandler('INTRODUCE', handler);

      // Mock request
      const requestValue = 'Bob';
      const request = createRequest('INTRODUCE', requestValue);
      await messenger.receive(JSON.stringify(request));

      expect(handler).toHaveBeenCalledWith(requestValue);

      const expectedResponse: MessageResponseError = {
        error: error.message,
        requestId,
      };
      expect(sendMessage).toHaveBeenCalledWith(JSON.stringify(expectedResponse));
    });
  });
});

describe('messenger pair', () => {
  const messengerA = new AsyncMessenger<MessagesFromA, MessagesFromB>();
  const messengerB = new AsyncMessenger<MessagesFromB, MessagesFromA>();

  messengerA.setSendMessage((message) => messengerB.receive(message));
  messengerB.setSendMessage((message) => messengerA.receive(message));

  test('should send message from A to B and receive response', () => {
    messengerB.addRequestHandler('INTRODUCE', (name) => `Welcome ${name}!`);

    const name = 'Alice';
    return expect(messengerA.send('INTRODUCE', name)).resolves.toBe(`Welcome ${name}!`);
  });

  test('should send message from A to B and receive error', () => {
    messengerB.addRequestHandler('INTRODUCE', (name) => {
      throw Error(`You are not welcome ${name}!`);
    });

    const name = 'Bob';
    return expect(messengerA.send('INTRODUCE', name)).rejects.toThrow(
      `You are not welcome ${name}!`,
    );
  });
});
