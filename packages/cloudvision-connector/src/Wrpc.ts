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

import {
  CloseParams,
  CloudVisionBatchedResult,
  CloudVisionMessage,
  CloudVisionParams,
  CloudVisionPublishRequest,
  CloudVisionResult,
  CloudVisionServiceResult,
  CloudVisionStatus,
  ConnectionCallback,
  EventCallback,
  GetCommand,
  NotifCallback,
  PauseParams,
  RequestContext,
  ResumeParams,
  ServiceRequest,
  StreamCommand,
  RequestIdentifier,
  WsCommand,
} from '../types';

import Parser from './Parser';
import {
  ACTIVE_CODE,
  CLOSE,
  CONNECTED,
  DISCONNECTED,
  EOF_CODE,
  ERROR,
  ID,
  PAUSE,
  PAUSED_CODE,
  PUBLISH,
  RESUME,
  SEARCH,
  SERVICE_REQUEST,
} from './constants';
import Emitter from './emitter';
import { log } from './logger';
import { createCloseParams, makeToken, validateResponse } from './utils';

type StreamArgs = [string, WsCommand, CloudVisionParams | ServiceRequest];

/**
 * Options passed to the constructor, that configure some global options
 *
 * `pauseStreams`: Negotiates the enabling of pause/resume with the server.
 *    Pause/resume is a way to add backpressure to the server, so that it stops
 *    sending notifications when the client cannot keep up.
 */
interface ConnectorOptions {
  batchResults: boolean;
  debugMode: boolean;
  pauseStreams: boolean;
}

/**
 * Wraps a given WebSocket with CloudVision API streaming and data querying
 * methods.
 */
export default class Wrpc {
  public static CONNECTED: typeof CONNECTED = CONNECTED;

  public static DISCONNECTED: typeof DISCONNECTED = DISCONNECTED;

  private closingStreams: Map<string, string>;

  private connectionEvents: Emitter;

  private connectorOptions: ConnectorOptions;

  private events: Emitter;

  public isRunning: boolean;

  private Parser: typeof Parser;

  private waitingStreams: Map<string, StreamArgs[]>;

  public streamRequests: Map<EventCallback, RequestIdentifier>;

  private activeStreams: Set<string>;

  private activeRequests: Set<string>;

  private ws!: WebSocket;

  private WebSocket: typeof WebSocket;

  public constructor(
    options: ConnectorOptions = {
      pauseStreams: false,
      batchResults: true,
      debugMode: false,
    },
    websocketClass = WebSocket,
    parser = Parser,
  ) {
    this.connectorOptions = options;
    this.isRunning = false;
    this.connectionEvents = new Emitter(); // State of the websocket connection
    this.events = new Emitter();
    this.closingStreams = new Map();
    this.waitingStreams = new Map();
    this.streamRequests = new Map();
    this.activeStreams = new Set();
    this.activeRequests = new Set();
    this.WebSocket = websocketClass;
    this.Parser = parser;
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

  public get streams(): Set<string> {
    return this.activeStreams;
  }

  public get streamInClosingState(): Map<string, string> {
    return this.closingStreams;
  }

  private addWaitingStream(
    waitingOnToken: string,
    token: string,
    command: StreamCommand,
    params: CloudVisionParams | ServiceRequest,
  ): void {
    const streamsWaiting = this.waitingStreams.get(waitingOnToken) || [];
    streamsWaiting.push([token, command, params]);
    this.waitingStreams.set(waitingOnToken, streamsWaiting);
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
  ): RequestIdentifier | null {
    if (!this.isRunning) {
      callback('Connection is down');
      return null;
    }
    const token: string = makeToken(command, params);
    const requestContext = { command };
    if (!this.activeRequests.has(token)) {
      // only execute request if not already getting data
      this.activeRequests.add(token);
      const callbackWithUnbind = this.makeCallbackWithUnbind(token, callback);
      this.events.bind(token, requestContext, callbackWithUnbind);
      this.sendMessageOrError(token, command, params);
      return { token, callback: callbackWithUnbind };
    }
    const queuedCallbackWithUnbind = this.makeQueuedCallbackWithUnbind(token, callback);
    this.events.bind(token, requestContext, queuedCallbackWithUnbind);
    return { token, callback: queuedCallbackWithUnbind };
  }

  /**
   * Cleans up all event emitters and active streams.
   * All bound callbacks will be unbound.
   */
  public cleanUpConnections(): void {
    this.activeStreams.clear();
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
    requests: RequestIdentifier[] | RequestIdentifier,
    closeParams: CloseParams,
    callback: NotifCallback,
  ): string {
    const closeToken: string = makeToken(CLOSE, closeParams);
    this.setRequestClosingState(requests, closeToken, callback);
    try {
      this.sendMessage(closeToken, CLOSE, closeParams);
    } catch (err) {
      log(ERROR, err);
      this.removeStreamClosingState(requests, closeToken);
      callback(err, undefined, undefined, closeToken);
    }
    return closeToken;
  }

  /**
   * Closes multiple backend requests in one `close` call.
   */
  public closeRequests(requests: RequestIdentifier[], callback: NotifCallback): string | null {
    const closeParams = createCloseParams(requests, this.events);

    if (closeParams) {
      return this.closeCommand(requests, closeParams, callback);
    }
    return null;
  }

  /**
   * Closes one single backend request.
   */
  public closeRequest(request: RequestIdentifier, callback: NotifCallback): string | null {
    const closeParams = createCloseParams(request, this.events);
    if (closeParams) {
      return this.closeCommand(request, closeParams, callback);
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
    this.connectionEvents.bind('connection', { command: 'connection' }, connectionCallback);

    return (): void => {
      this.connectionEvents.unbind('connection', connectionCallback);
    };
  }

  /**
   * Enables any session wide options by negotiating with the server
   */
  private enableOptions(callback: NotifCallback): void {
    if (this.connectorOptions.pauseStreams) {
      this.pause({ pauseStreams: true }, callback);
    } else {
      callback(null);
    }
  }

  /**
   * Sends the command along with the params to the API, if the WebSocket is
   * connected. The response is received via the provided callback function.
   */
  public get(
    command: GetCommand,
    params: CloudVisionParams,
    callback: NotifCallback,
  ): RequestIdentifier | null {
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
        this.activeRequests.delete(token);
        this.events.unbind(token, callbackWithUnbind);
      }
      callback(err, result, status, token, requestContext);
    };

    return callbackWithUnbind;
  }

  private makeQueuedCallbackWithUnbind(token: string, callback: NotifCallback): EventCallback {
    const callbackWithUnbind = (
      requestContext: RequestContext,
      err: string | null,
      result?: CloudVisionBatchedResult | CloudVisionResult,
      status?: CloudVisionStatus,
    ): void => {
      if (err) {
        // Unbind callback and invoke callback only when any error message is received
        this.events.unbind(token, callbackWithUnbind);
        callback(err, result, status, token, requestContext);
      }
    };

    return callbackWithUnbind;
  }

  /**
   * Writes data in params to the CloudVision API. It receives one message via
   * the provided callback, to indicate whether the write is successful or not.
   */
  public publish(params: CloudVisionPublishRequest, callback: NotifCallback): string | null {
    const result = this.callCommand(PUBLISH, params, callback);
    return result ? result.token : null;
  }

  /**
   * Cleans up the stream closing state set in `setRequestClosingState`, as well
   * as re-subscribing to any streams (with the same token as the stream that
   * was just closed) opened up during the closing of the current stream.
   */
  private removeStreamClosingState(
    streams: RequestIdentifier[] | RequestIdentifier,
    closeToken: string,
  ): void {
    if (Array.isArray(streams)) {
      const streamsLen = streams.length;
      for (let i = 0; i < streamsLen; i += 1) {
        const { token } = streams[i];
        this.closingStreams.delete(token);
        const streamsArgs = this.waitingStreams.get(closeToken);
        if (streamsArgs) {
          const streamsArgsLen = streamsArgs.length;
          for (let j = 0; j < streamsArgsLen; j += 1) {
            this.reSubscribeStream(streamsArgs[j], closeToken);
          }
        }
      }
    } else {
      this.closingStreams.delete(streams.token);
      const streamArgs = this.waitingStreams.get(closeToken);
      if (streamArgs) {
        this.reSubscribeStream(streamArgs[0], closeToken);
      }
    }
  }

  /**
   * Send a service request command to the CloudVision API
   */
  public requestService(request: ServiceRequest, callback: NotifCallback): string | null {
    const result = this.callCommand(SERVICE_REQUEST, request, callback);
    return result ? result.token : null;
  }

  /**
   * Re initiates a subscribe if there has been a `subscribe` call for the
   * stream while the stream was closing.
   */
  private reSubscribeStream(streamArgs: StreamArgs, closeToken: string): void {
    this.events.unbindAll(closeToken);
    this.waitingStreams.delete(closeToken);
    this.sendMessage(...streamArgs);
  }

  /**
   * PRIVATE METHOD
   * Requests the server to resume one of the currently paused streams.
   */
  private resume(params: ResumeParams, callback: NotifCallback): string | null {
    const result = this.callCommand(RESUME, params, callback);
    return result ? result.token : null;
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
        // Enable any options if they have been configured
        this.isRunning = true;
        this.enableOptions((err, _res, status, token): void => {
          // We're good to go
          if (status && status.code !== EOF_CODE) {
            log(ERROR, err, status, token);
          }
          this.connectionEvents.emit('connection', Wrpc.CONNECTED, event);
        });
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
        msg = this.Parser.parse(event.data, this.connectorOptions.batchResults);
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

      // Automatically resume streams that have been paused by the server
      if (status && status.code === PAUSED_CODE) {
        const cb = (
          err: string | null,
          _result?: CloudVisionBatchedResult | CloudVisionResult | CloudVisionServiceResult,
          resumeStatus?: CloudVisionStatus,
        ): void => {
          if (err) {
            log(ERROR, err, resumeStatus);
          }
        };
        this.resume({ token }, cb);
        return;
      }
      this.events.emit(token, null, msg.result, status);
    };
  }

  public search(params: CloudVisionParams, callback: NotifCallback): string | null {
    const result = this.callCommand(SEARCH, params, callback);
    return result ? result.token : null;
  }

  /**
   * Sends a message on the WebSocket with the proper parameters, so that the
   * CloudVision API can respond accordingly.
   */
  private sendMessage(
    token: string,
    command: WsCommand,
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
  ): void {
    try {
      this.sendMessage(token, command, params);
    } catch (err) {
      log(ERROR, err);
      // notifAndUnBindCallback(err, undefined, undefined, token);
      this.events.emit(token, err, undefined, undefined);
    }
  }

  /**
   * Sets all the parameters for one or more streams when they are closed.
   * When the `close` request has been successfully processed,
   * `removeStreamClosingState` is called to clean up any closing state for
   * stream requests.
   */
  private setRequestClosingState(
    requests: RequestIdentifier[] | RequestIdentifier,
    closeToken: string,
    callback: NotifCallback,
  ): void {
    const closeCallback = (
      requestContext: RequestContext,
      err: string | null,
      result?: CloudVisionBatchedResult | CloudVisionResult,
      status?: CloudVisionStatus,
    ): void => {
      this.removeStreamClosingState(requests, closeToken);
      callback(err, result, status, closeToken, requestContext);
    };

    if (Array.isArray(requests)) {
      const requestsLen = requests.length;
      for (let i = 0; i < requestsLen; i += 1) {
        const { token } = requests[i];

        // Remove token from activeRequests in case it is a GET request
        this.activeRequests.delete(token);

        const oldToken = this.closingStreams.get(token);
        this.waitingStreams.delete(oldToken || '');
        this.closingStreams.set(token, closeToken);
      }
    } else {
      // Remove token from activeRequests in case it is a GET request
      this.activeRequests.delete(requests.token);

      this.closingStreams.set(requests.token, closeToken);
    }

    this.events.bind(closeToken, { command: CLOSE }, closeCallback);
  }

  /**
   * Sends the command along with the params to the API, which creates a
   * subscriptions on the server.  It receives a stream of messages via the
   * provided callback, as these messages get produced.
   * The client can close the stream with returned close function, or use the
   * attached identifier (`closeFunction.identifier`) to close multiple streams
   * at once via `closeRequest`.
   */
  public stream(
    command: StreamCommand,
    params: CloudVisionParams | ServiceRequest,
    callback: NotifCallback,
  ): RequestIdentifier | null {
    if (!this.isRunning) {
      callback('Connection is down');
      return null;
    }
    const token = makeToken(command, params);
    const callerRequestContext = { command };
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
      }
      if (status && status.code === ACTIVE_CODE) {
        this.activeStreams.add(token);
      }
      const requestId = callback(err, result, status, token, requestContext);
      if (requestId as unknown) {
        this.streamRequests.set(callbackWithUnbind, (requestId as unknown) as RequestIdentifier);
      }
    };
    const numCallbacks = this.events.bind(token, callerRequestContext, callbackWithUnbind);
    if (numCallbacks === 1) {
      // Only execute the request on the first callback.
      // If there are open request to the same data, just attach the callback
      const closingStreamToken = this.closingStreams.get(token);
      if (closingStreamToken) {
        // The stream is still closing, so wait for it to close before re requesting
        this.addWaitingStream(closingStreamToken, token, command, params);
      } else {
        this.sendMessageOrError(token, command, params);
      }
    } else if (this.activeStreams.has(token)) {
      // The stream is already open immediately call get
      callback(null, undefined, { code: ACTIVE_CODE }, token, callerRequestContext);
    }

    return { token, callback: callbackWithUnbind };
  }

  /**
   * Configures pausing of results on the server. When the pause feature is enabled,
   * the server pauses the results returned to the client every x number of bytes.
   *
   * When pausing is enabled, only the new streams created after that will be paused
   * (i.e. existing streams are not affected). To continue receiving results, a
   * wrpc client has to send a 'resume' command with the desired stream token to
   * unpause. Currently, the cloudvision-connector automatically resumes any streams
   * paused by the server.
   */
  private pause(params: PauseParams, callback: NotifCallback): string | null {
    const result = this.callCommand(PAUSE, params, callback);
    return result ? result.token : null;
  }
}
