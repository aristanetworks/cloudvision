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

import { v4 as uuidv4 } from 'uuid';

import {
  CloseParams,
  CloudVisionBatchedResult,
  CloudVisionMessage,
  CloudVisionMetaData,
  CloudVisionParams,
  CloudVisionPublishRequest,
  CloudVisionResult,
  CloudVisionStatus,
  ConnectionCallback,
  EventCallback,
  GetCommand,
  NotifCallback,
  RequestContext,
  ServiceRequest,
  StreamCommand,
  SubscriptionIdentifier,
  WsCommand,
} from '../types';

import Parser from './Parser';
import {
  ACTIVE_CODE,
  CLOSE,
  CONNECTED,
  DISCONNECTED,
  EOF,
  EOF_CODE,
  ERROR,
  GET_REQUEST_COMPLETED,
  ID,
  PUBLISH,
  SEARCH,
  SERVICE_REQUEST,
} from './constants';
import Emitter from './emitter';
import Instrumentation, { InstrumentationConfig } from './instrumentation';
import { log } from './logger';
import { createCloseParams, toBinaryKey, validateResponse } from './utils';

/**
 * Options passed to the constructor, that configure some global options
 */
interface ConnectorOptions {
  batchResults: boolean;
  debugMode: boolean;
  nanosecondMode: boolean;
  instrumentationConfig?: InstrumentationConfig;
}

/**
 * Wraps a given WebSocket with CloudVision API streaming and data querying
 * methods.
 */
export default class Wrpc {
  public static CONNECTED: typeof CONNECTED = CONNECTED;

  public static DISCONNECTED: typeof DISCONNECTED = DISCONNECTED;

  private connectionEvents: Emitter;

  private connectorOptions: ConnectorOptions;

  private events: Emitter;

  public isRunning: boolean;

  private Parser: typeof Parser;

  private instrumentation: Instrumentation;

  private ws!: WebSocket;

  private WebSocket: typeof WebSocket;

  public constructor(
    options: ConnectorOptions = {
      batchResults: true,
      debugMode: false,
      nanosecondMode: false,
    },
    websocketClass = WebSocket,
    parser = Parser,
  ) {
    this.connectorOptions = options;
    this.isRunning = false;
    this.connectionEvents = new Emitter(); // State of the websocket connection
    this.events = new Emitter();
    this.WebSocket = websocketClass;
    this.Parser = parser;
    this.instrumentation = new Instrumentation(options.instrumentationConfig);
  }

  public get websocket(): WebSocket {
    return this.ws;
  }

  public get connectionEmitter(): Emitter {
    return this.connectionEvents;
  }

  public get eventsEmitter(): Emitter {
    return this.events;
  }

  /**
   * PRIVATE METHOD
   * Sends the `get` command along with params to the API. The response is
   * received via the provided callback function.
   * This request encompasses only historical data, so the callback is
   * immediately unbound once the data is received.
   *
   * **NOTE**: This method does not check if the WebSocket is correctly
   * initialized or connected.
   */
  private callCommand(
    command: WsCommand,
    params: CloudVisionParams | CloudVisionPublishRequest | ServiceRequest,
    callback: NotifCallback,
  ): string | null {
    if (!this.isRunning) {
      callback('Connection is down');
      return null;
    }
    const token: string = uuidv4();
    const requestContext = { command, encodedParams: toBinaryKey(params), token };
    const callbackWithUnbind = this.makeCallbackWithUnbind(token, callback);
    this.events.bind(token, requestContext, callbackWithUnbind);
    this.sendMessageOrError(token, command, params, requestContext);

    return token;
  }

  /**
   * Cleans up all event emitters.
   * All bound callbacks will be unbound.
   */
  public cleanUpConnections(): void {
    this.events.close();
  }

  /**
   * Closes connection to the server and cleans up all event emitters.
   * All bound callbacks will be unbound.
   */
  public close(): void {
    this.closeWs(new CloseEvent('close'));
    this.connectionEvents.close();
    this.ws.close();
  }

  private closeWs(event: CloseEvent): void {
    this.isRunning = false;
    this.cleanUpConnections();
    this.connectionEvents.emit('connection', Wrpc.DISCONNECTED, event);
  }

  private closeCommand(
    streams: SubscriptionIdentifier[] | SubscriptionIdentifier,
    closeParams: CloseParams,
    callback: NotifCallback,
  ): string {
    const closeToken: string = uuidv4();
    const requestContext: RequestContext = {
      command: CLOSE,
      encodedParams: toBinaryKey(streams),
      token: closeToken,
    };

    const callbackWithUnbind = this.makeCallbackWithUnbind(closeToken, callback);
    this.events.bind(closeToken, requestContext, callbackWithUnbind);

    try {
      this.sendMessage(closeToken, CLOSE, requestContext, closeParams);
    } catch (err) {
      log(ERROR, err);
      callback(err, undefined, undefined, closeToken);
    }
    return closeToken;
  }

  /**
   * Closes multiple streams in one `close` call.
   */
  public closeStreams(streams: SubscriptionIdentifier[], callback: NotifCallback): string | null {
    const closeParams = createCloseParams(streams, this.events);
    if (closeParams) {
      return this.closeCommand(streams, closeParams, callback);
    }
    return null;
  }

  /**
   * Closes one single stream.
   */
  public closeStream(stream: SubscriptionIdentifier, callback: NotifCallback): string | null {
    const closeParams = createCloseParams(stream, this.events);
    if (closeParams) {
      return this.closeCommand(stream, closeParams, callback);
    }
    return null;
  }

  /**
   * Subscribes a callback to connection events.
   * The callback can receive either `Wrpc.CONNECTED or `Wrpc.DISCONNECTED`.
   */
  public connection(callback: ConnectionCallback): () => void {
    const connectionCallback = (
      _requestContext: RequestContext,
      connEvent: string,
      wsEvent: Event,
    ): void => {
      callback(connEvent, wsEvent);
    };
    this.connectionEvents.bind(
      'connection',
      { command: 'connection', encodedParams: '', token: '' },
      connectionCallback,
    );

    return (): void => {
      this.connectionEvents.unbind('connection', connectionCallback);
    };
  }

  /**
   * Sends the command along with the params to the API, if the WebSocket is
   * connected. The response is received via the provided callback function.
   */
  public get(
    command: GetCommand,
    params: CloudVisionParams,
    callback: NotifCallback,
  ): string | null {
    return this.callCommand(command, params, callback);
  }

  private makeCallbackWithUnbind(token: string, callback: NotifCallback): EventCallback {
    const callbackWithUnbind = (
      requestContext: RequestContext,
      err: string | null,
      result?: CloudVisionBatchedResult | CloudVisionResult,
      status?: CloudVisionStatus,
    ): void => {
      if (err) {
        // Unbind callback when any error message is received
        this.events.unbind(token, callbackWithUnbind);
        this.instrumentation.callInfo(requestContext.command, requestContext, {
          error: err,
        });
      }
      this.instrumentation.callEnd(requestContext.command, requestContext);
      callback(err, result, status, token, requestContext);
    };

    return callbackWithUnbind;
  }

  /**
   * Writes data in params to the CloudVision API. It receives one message via
   * the provided callback, to indicate whether the write is successful or not.
   */
  public publish(params: CloudVisionPublishRequest, callback: NotifCallback): string | null {
    return this.callCommand(PUBLISH, params, callback);
  }

  /**
   * Send a service request command to the CloudVision API
   */
  public requestService(request: ServiceRequest, callback: NotifCallback): string | null {
    return this.callCommand(SERVICE_REQUEST, request, callback);
  }

  /**
   * Run connects connector to the specified url
   */
  public run(url: string): void {
    this.runWithWs(new this.WebSocket(url));
  }

  /**
   * PRIVATE METHOD
   * Sets the specified WebSocket on the class and binds `onopen`, `onclose`, and
   * `onmessage` listeners.
   *
   * - onopen: The `Wrpc.CONNECTED` event is emitted, and the WebSocket is set
   * to isRunning equals `true`.
   * - onclose: The `Wrpc.DISCONNECTED` event is emitted, and the WebSocket is
   * set to isRunning equals `false`.
   * - onmessage: The message is parsed and the event type `msg.token` is
   * emitted. This results in the calling of all callbacks bound to that event
   * type.
   */
  private runWithWs(ws: WebSocket): void {
    this.ws = ws;
    this.ws.onopen = (event): void => {
      if (!this.isRunning) {
        this.isRunning = true;
        this.connectionEvents.emit('connection', Wrpc.CONNECTED, event);
      }
    };

    this.ws.onclose = (event): void => {
      this.closeWs(event);
    };

    this.ws.onmessage = (event): void => {
      if (typeof event.data !== 'string') {
        // messages that aren't strings are invalid
        return;
      }

      let msg: CloudVisionMessage;
      try {
        msg = this.Parser.parse(
          event.data,
          this.connectorOptions.batchResults,
          this.connectorOptions.nanosecondMode,
        );
        if (this.connectorOptions.debugMode) {
          // Used for debugging
          self.postMessage(
            {
              response: msg,
              source: ID,
              timestamp: Date.now(),
            },
            '*',
          );
        }
      } catch (err) {
        log(ERROR, err);
        return;
      }

      if (!msg || !msg.token) {
        log(ERROR, 'No message body or message token');
        return;
      }

      const { error, status, token } = msg;

      if (error) {
        this.events.emit(token, error, msg.result, status);
        return;
      }

      validateResponse(msg.result, status, token, this.connectorOptions.batchResults);

      this.events.emit(token, null, msg.result, status);
      if (
        msg.result?.metadata &&
        (msg.result.metadata as CloudVisionMetaData<string>)[GET_REQUEST_COMPLETED] === EOF
      ) {
        this.events.emit(token, null, null, { message: GET_REQUEST_COMPLETED, code: EOF_CODE });
      }
    };
  }

  public search(params: CloudVisionParams, callback: NotifCallback): string | null {
    return this.callCommand(SEARCH, params, callback);
  }

  /**
   * Sends a message on the WebSocket with the proper parameters, so that the
   * CloudVision API can respond accordingly.
   */
  private sendMessage(
    token: string,
    command: WsCommand,
    requestContext: RequestContext,
    params: CloudVisionParams | CloudVisionPublishRequest | ServiceRequest,
  ): void {
    if (this.connectorOptions.debugMode) {
      // Used for debugging
      self.postMessage(
        {
          request: {
            token,
            command,
            params,
          },
          source: ID,
          timestamp: Date.now(),
        },
        '*',
      );
    }
    this.instrumentation.callStart(command, requestContext);
    this.ws.send(
      this.Parser.stringify({
        token,
        command,
        params,
      }),
    );
  }

  private sendMessageOrError(
    token: string,
    command: WsCommand,
    params: CloudVisionParams | CloudVisionPublishRequest | ServiceRequest,
    requestContext: RequestContext,
  ): void {
    try {
      this.sendMessage(token, command, requestContext, params);
    } catch (err) {
      log(ERROR, err);
      // notifAndUnBindCallback(err, undefined, undefined, token);
      this.events.emit(token, err, undefined, undefined);
    }
  }

  /**
   * Sends the command along with the params to the API, which creates a
   * subscriptions on the server.  It receives a stream of messages via the
   * provided callback, as these messages get produced.
   * The client can close the stream with returned close function, or use the
   * attached identifier (`closeFunction.identifier`) to close multiple streams
   * at once via `closeStream`.
   */
  public stream(
    command: StreamCommand,
    params: CloudVisionParams | ServiceRequest,
    callback: NotifCallback,
  ): SubscriptionIdentifier | null {
    if (!this.isRunning) {
      callback('Connection is down');
      return null;
    }
    const token = uuidv4();
    const callerRequestContext = { command, encodedParams: toBinaryKey(params), token };
    const callbackWithUnbind: EventCallback = (
      requestContext: RequestContext,
      err: string | null,
      result?: CloudVisionBatchedResult | CloudVisionResult,
      status?: CloudVisionStatus,
    ): void => {
      if (err) {
        // Unbind callback when any error message is received.
        // No need to send close to server because it will close them automatically.
        this.events.unbind(token, callbackWithUnbind);
        this.instrumentation.callInfo(callerRequestContext.command, callerRequestContext, {
          error: err,
        });
        this.instrumentation.callEnd(requestContext.command, requestContext);
      }
      if (status && status.code === ACTIVE_CODE) {
        this.instrumentation.callInfo(callerRequestContext.command, callerRequestContext, {
          message: 'stream active',
        });
      }
      callback(err, result, status, token, requestContext);
    };
    this.events.bind(token, callerRequestContext, callbackWithUnbind);
    this.sendMessageOrError(token, command, params, callerRequestContext);

    return { token, callback: callbackWithUnbind };
  }
}
