import {
  Decoder,
  Encoder,
  MessageDefinitions,
  MessageDefinitionsResponse,
  MessageRequest,
  MessageResponse,
  MessageType,
  RequestHandler,
} from '../types';

export const UNDEFINED_POST_MESSAGE_ERROR = Error(
  '`postMessage` property of messenger not set. Did you forget to call `setSendMessage`?',
);

interface PendingRequest {
  reject(reason: Error): void;
  resolve(value: unknown): void;

  timeout?: NodeJS.Timeout;
}

/**
 * Messenger class that sends encoded messages to another messenger instance.
 *
 * @typeparam S Type of messages sent by this messenger.
 * @typeparam R Type of messages received by this messenger.
 */
export default class AsyncMessenger<S extends MessageDefinitions, R extends MessageDefinitions> {
  /** Function to stringify sent messages. */
  private decoder: Decoder;

  /** Function to parse received messages. */
  private encoder: Encoder;

  private nextReqIndex: number;

  private onWarning: (warning: string) => void;

  /** Object of unresolved requests keyed by request ID. */
  private pendingRequests: {
    [requestId: string]: PendingRequest;
  };

  /** Object of request handlers keyed by message type. */
  private requestHandlers: {
    [T in keyof R]?: RequestHandler<R[T]>;
  };

  /** Send an encoded message object. */
  private postMessage?: (message: string) => void;

  /**
   * Create a new messenger.
   *
   * @param encoder Optional encoder for stringifying message objects.
   * @param decoder Optional decoder for parsing stringified message objects.
   * @param onWarning Function to call for warnings.
   */
  public constructor(
    encoder: Encoder = JSON.stringify,
    decoder: Decoder = JSON.parse,
    onWarning: (warning: string) => void = console.warn, // eslint-disable-line no-console
  ) {
    this.decoder = decoder;
    this.encoder = encoder;
    this.nextReqIndex = 0;
    this.onWarning = onWarning;
    this.pendingRequests = {};
    this.requestHandlers = {};
  }

  /** Set the function to call when the messenger attempts to send an encoded message. */
  public setSendMessage(postMessage: (message: string) => void): this {
    this.postMessage = postMessage;

    return this;
  }

  /**
   * Add a callback function that is called when a request of the passed type is received.
   * The callback should return the data or a Promise that resolves with this data to be sent in the
   * response. If the returned Promise rejects or the callback throws an error, an error response
   * will be sent.
   */
  public addRequestHandler<T extends keyof R>(type: T, handler: RequestHandler<R[T]>): this {
    this.requestHandlers[type] = handler;

    return this;
  }

  /**
   * Create a new message, returning a Promise that resolves with the response data, or is rejected
   * with the response error. If a timeout is passed, the Promise will reject after this time with
   * no response.
   */
  public send<T extends MessageType<S>>(
    type: T,
    data: S[T]['request'],
    timeout?: number,
  ): Promise<S[T]['response']> {
    if (!this.postMessage) {
      return Promise.reject(UNDEFINED_POST_MESSAGE_ERROR);
    }

    // Get a unique request ID for this message
    const reqIndex = this.nextReqIndex;
    this.nextReqIndex += 1;

    const requestId = `${type}-${reqIndex}`;

    // Create Promise to resolve / reject when response is received
    const promise = new Promise((resolve, reject) => {
      const pendingRequest: PendingRequest = { reject, resolve };

      if (timeout) {
        pendingRequest.timeout = setTimeout(() => {
          reject(Error(`Timeout after ${timeout}ms`));
          delete this.pendingRequests[requestId];
        }, timeout);
      }

      this.pendingRequests[requestId] = pendingRequest;
    });

    const request: MessageRequest<T, S[T]['request']> = {
      data,
      requestId,
      type,
    };

    // Stringify request object before sending to other messenger
    const message = this.encoder(request);
    this.postMessage(message);

    return promise;
  }

  /**
   * Receive an encoded message object. The returned Promise resolves when the request has been
   * processed. In the case of a request, this is when the relevant handler resolves with a value
   * and sends a response.
   */
  public async receive(message: string): Promise<void> {
    const request = this.decoder(message) as
      | MessageRequest<string, unknown>
      | MessageResponse<unknown>;

    if ('type' in request) {
      // This is a request from another messenger
      await this.handleRequest(request);
    } else {
      // This is a response from another messenger to a previous request
      this.handleResponse(request);
    }
  }

  /** Handle a new request from another messenger. */
  private async handleRequest({
    data,
    requestId,
    type,
  }: MessageRequest<string, unknown>): Promise<void> {
    if (!this.postMessage) {
      throw UNDEFINED_POST_MESSAGE_ERROR;
    }

    let response: MessageResponse<MessageDefinitionsResponse<R>>;

    // Get a matching handler for the request message type
    const handler = this.requestHandlers[type];
    if (handler) {
      try {
        // Handler may return a Promise
        const result = await handler(data);

        response = {
          data: result,
          requestId,
        };
      } catch (error) {
        response = {
          error: error.message,
          requestId,
        };
      }
    } else {
      response = {
        error: `No request handler defined for message type "${type}"`,
        requestId,
      };
    }

    const message = this.encoder(response);
    this.postMessage(message);
  }

  /** Handle a response to a previously sent request. */
  private handleResponse(response: MessageResponse<unknown>): void {
    if (this.pendingRequests.hasOwnProperty(response.requestId)) {
      const { reject, resolve, timeout } = this.pendingRequests[response.requestId];

      if ('error' in response) {
        reject(Error(response.error));
      } else {
        resolve(response.data);
      }

      if (timeout !== undefined) {
        clearTimeout(timeout);
      }
      delete this.pendingRequests[response.requestId];
    } else {
      // We don't recognise this request ID
      this.onWarning(
        `Response for request ID "${response.requestId}" either timed out or is unexpected`,
      );
    }
  }
}
