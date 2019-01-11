/* @flow */
/* eslint-disable no-console */

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

import JSONBigNumber from 'json-bignumber';

import {
  ACTIVE_CODE,
  CLOSE,
  CONNECTED,
  DISCONNECTED,
  EOF_CODE,
  PAUSE,
  PAUSED_CODE,
  RESUME,
} from './constants';
import Emitter from './emitter';
import type { EmitterType, EventCallback } from './emitter';
import {
  bigNumberParse,
  createCloseParams,
  makeToken,
  validateResponse,
} from './utils';
import type {
  CachedFrame,
  CloudVisionMessage,
  CloudVisionParams,
  CloudVisionPublishParams,
  CloudVisionUpdate,
  ConnectionCallback,
  PauseParams,
  RawNotifCallback,
  RawPublishCallback,
  ResumeParams,
  ServiceCallback,
  ServiceRequest,
  SubscriptionIdentifier,
  WsCommand,
} from './utils';

/**
 * A function that unbinds (closes) the subscription. If there is an error
 * establishing the subscriptions `null` will be returned.
 */
export type SubscriptionCloseFunction = ?Function;

type StreamArgs = [string, WsCommand, CloudVisionParams];

/**
 * Options passed to the constructor, that configure some global options
 *
 * `pauseStreams`: Negotiates the enabling of pause/resume with the server.
 *    Pause/resume is a way to add backpressure to the server, so that it stops
 *    sending notifications when the client cannot keep up.
 */
type ConnectorOptions = {
  pauseStreams: boolean,
};

/**
 * Wraps a given WebSocket with CloudVision API streaming and data quering
 * methods.
 */
class WRPC {
  static CONNECTED: string;

  static DISCONNECTED: string;

  closingStreams: Map<string, string>;

  connectionEvents: EmitterType;

  connectorOptions: ConnectorOptions;

  debugMode: boolean;

  eventsEmitter: EmitterType;

  frameCache: Map<string, Array<CachedFrame>>;

  isRunning: boolean;

  waitingStreams: Map<string, Array<StreamArgs>>;

  activeStreams: Set<string>;

  ws: any;

  WebSocket: any;

  constructor(
    options: ConnectorOptions = { pauseStreams: false },
    websocketClass: ?any = WebSocket,
  ) {
    this.connectorOptions = options;
    this.debugMode = false;
    this.isRunning = false;
    this.connectionEvents = new Emitter(); // State of the websocket connection
    this.eventsEmitter = new Emitter();
    this.frameCache = new Map();
    this.closingStreams = new Map();
    this.waitingStreams = new Map();
    this.activeStreams = new Set();
    this.WebSocket = websocketClass;
  }

  /**
   * Closes connection to the server and cleans up all event emitters.
   * All bound callbacks will be unbound.
   */
  close(): void {
    this.connectionEvents.close();
    this.eventsEmitter.close();
    this.ws.close();
  }

  /**
   * Closes multiple streams in one `close` call.
   */
  closeStreams(
    command: WsCommand,
    streams: Array<SubscriptionIdentifier>,
    callback: RawNotifCallback,
  ) {
    const closeParams = createCloseParams(streams, this.eventsEmitter);
    if (closeParams) {
      const closeToken: string = makeToken(command, closeParams);
      this.setStreamClosingState(streams, closeToken);
      try {
        this.sendMessage(closeToken, command, closeParams);
      } catch (err) {
        console.error(err);
        this.removeStreamClosingState(streams, closeToken);
        callback(err, null);
      }
    }
  }

  /**
   * Closes one single stream.
   */
  closeStream(
    command: WsCommand,
    token: string,
    callback: EventCallback,
  ) {
    const closeParams = createCloseParams({ token, callback }, this.eventsEmitter);
    if (closeParams) {
      const closeToken: string = makeToken(command, closeParams);
      this.setStreamClosingState(token, closeToken);
      try {
        this.sendMessage(closeToken, command, closeParams);
      } catch (err) {
        console.error(err);
        this.removeStreamClosingState(token, closeToken);
        callback(err, null);
      }
    }
  }

  /**
   * Subscribes a callback to connection events.
   * The callback can receive either `WRPC.CONNECTED or `WRPC.DISCONNECTED`.
   */
  connection(callback: ConnectionCallback): Function {
    this.connectionEvents.bind('connection', callback);

    return () => {
      this.connectionEvents.unbind('connection', callback);
    };
  }

  /**
   * Enables any session wide options by negotiating with the server
   */
  enableOptions(callback: RawNotifCallback) {
    if (this.connectorOptions.pauseStreams) {
      this.pause(PAUSE, { pauseStreams: true }, callback);
    } else {
      callback();
    }
  }

  /**
   * Sends the command along with the params to the API, if the WebSocket is
   * connected. The response is recieved via the provided callback function.
   */
  get(
    command: WsCommand,
    params: CloudVisionParams,
    callback: RawNotifCallback,
  ): string | null {
    if (!this.isRunning) {
      return null;
    }
    return this.unsafeGet(command, params, callback);
  }

  /**
   * Gets all cached WebSocket frames for the token.
   */
  getFrame(token: string): ?Array<CachedFrame> {
    return this.frameCache.get(token);
  }

  /**
   * Writes data in params to the CloudVision API. It receives one message via
   * the provided callback, to indicate whether the write is successful or not.
   */
  publish(
    command: WsCommand,
    params: CloudVisionPublishParams,
    callback: RawPublishCallback,
  ) {
    if (!this.isRunning) {
      callback('Connection is down');
      return;
    }
    const token = makeToken(command, params);
    const callbackWithUnbind: EventCallback = (err, result, status) => {
      if (err) {
        // Unbind callback when any error is received
        this.eventsEmitter.unbind(token, callbackWithUnbind);
      }
      callback(err, status);
    };
    this.eventsEmitter.bind(token, callbackWithUnbind);

    try {
      this.sendMessage(token, command, params);
    } catch (err) {
      console.error(err);
      this.eventsEmitter.unbind(token, callbackWithUnbind);
      callback(err);
    }
  }

  /**
   * Removes all the cached WebSocket frames for the token.
   */
  removeFrame(token: string) {
    this.frameCache.delete(token);
  }

  /**
   * Cleans up the steam closing state set in `setStreamClosingState`, as well
   * as re-subscribing to any streams (with the same token as the stream that
   * was just closed) opened up during the closing of the current stream.
   */
  removeStreamClosingState(
    streams: Array<SubscriptionIdentifier> | string,
    closeToken: string,
  ) {
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
      this.closingStreams.delete(streams);
      const streamArgs = this.waitingStreams.get(closeToken);
      if (streamArgs) {
        this.reSubscribeStream(streamArgs[0], closeToken);
      }
    }
  }

  /**
   * Send a service request command to the CloudVision API
   */
  requestService(
    command: WsCommand,
    request: ServiceRequest,
    callback: ServiceCallback,
  ) {
    if (!this.isRunning) {
      callback('Connection is down', undefined, {});
      return;
    }
    const token = makeToken(command, request);
    const callbackWithUnbind: EventCallback = (err, result, status) => {
      if (err) {
        // Unbind callback when any error is received
        this.eventsEmitter.unbind(token, callbackWithUnbind);
      }
      if (status && status.code === EOF_CODE) {
        return;
      }
      callback(err, result, status);
    };
    this.eventsEmitter.bind(token, callbackWithUnbind);

    try {
      this.sendMessage(token, command, request);
    } catch (err) {
      console.error(err);
      this.eventsEmitter.unbind(token, callbackWithUnbind);
      callback(err, undefined, {});
    }
  }

  /**
   * Re initiates a subscribe if there has been a `subscribe` call for the
   * stream while the stream was closing.
   */
  reSubscribeStream(streamArgs: StreamArgs, closeToken: string) {
    this.eventsEmitter.unbindAll(closeToken);
    this.waitingStreams.delete(closeToken);
    this.sendMessage(...streamArgs);
  }

  /**
   * PRIVATE METHOD
   * Requests the server to resume one of the currently paused streams.
   */
  resume(pausedToken: string) {
    const params: ResumeParams = {
      token: pausedToken,
    };
    const command = RESUME;
    const token = makeToken(command, params);
    try {
      this.sendMessage(token, command, params);
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Run connects connector to the specified url
   */
  run(url: string): void {
    this.runWithWs(new this.WebSocket(url));
  }

  /**
   * PRIVATE METHOD
   * Sets the specifed WebSocket on the class and binds `onopen`, `onclose`, and
   * `onmessage` listeners.
   *
   * - onopen: The `WRPC.CONNECTED` event is emited, and the WebSocket is set
   * to isRunning equals `true`.
   * - onclose: The `WRPC.DISCONNECTED` event is emited, and the WebSocket is
   * set to isRunning equals `false`.
   * - onmessage: The message is parsed and the event type `msg.token` is
   * emitted. This results in the calling of all callbacks bound to that event
   * type.
   */
  runWithWs(ws: WebSocket): void {
    this.ws = ws;
    this.ws.onopen = (event) => {
      if (!this.isRunning) {
        // Enable any options if they have been configured
        this.isRunning = true;
        this.enableOptions((err, res, status) => {
          // We're good to go
          if (status && status.code !== EOF_CODE) {
            console.error(err);
          }
          this.connectionEvents.emit('connection', WRPC.CONNECTED, event);
        });
      }
    };

    this.ws.onclose = (event) => {
      this.isRunning = false;
      this.connectionEvents.emit('connection', WRPC.DISCONNECTED, event);
    };

    this.ws.onmessage = (event) => {
      if (typeof event.data !== 'string') {
        // messages that aren't strings are invalid
        return;
      }

      let msg: CloudVisionMessage;
      let bigNumberMsg: ?CloudVisionMessage;
      try {
        msg = JSON.parse(event.data);
        if (this.debugMode) {
          // Used for debugging
          window.postMessage({
            response: msg,
          }, '*');
        }
        if (bigNumberParse(msg.token, this.eventsEmitter.getEventsMap())) {
          bigNumberMsg = JSONBigNumber.parse(event.data);
        }
      } catch (err) {
        console.error(err);
        return;
      }

      if (!msg || !msg.token) {
        console.error('No message body or message token');
        return;
      }

      const { error, status, token } = msg;

      if (error) {
        this.eventsEmitter.emit(token, error, msg.result, status);
        return;
      }

      validateResponse(msg.result, status, token);

      // Automatically resume streams that have been paused by the server
      if (status && status.code === PAUSED_CODE) {
        this.resume(token);
        return;
      }

      const result: CloudVisionUpdate = bigNumberMsg && bigNumberMsg.result
        ? bigNumberMsg.result : msg.result;
      this.setFrame(token, { result, status });
      this.eventsEmitter.emit(token, null, result, status);
    };
  }

  search(
    command: WsCommand,
    params: CloudVisionParams,
    callback: RawNotifCallback,
  ) {
    if (!this.isRunning) {
      return null;
    }
    return this.unsafeGet(command, params, callback);
  }

  /**
   * Sends a message on the WebSocket with the proper parameters, so that the
   * CloudVision API can respond accoringly.
   */
  sendMessage(
    token: string,
    command: WsCommand,
    params: CloudVisionParams,
  ) {
    if (this.debugMode) {
      // Used for debugging
      window.postMessage({
        request: {
          token,
          command,
          params,
        },
      }, '*');
    }
    this.ws.send(JSON.stringify({
      token,
      command,
      params,
    }));
  }

  /**
   * Caches a WebSocket frame for the given token id, so responses can be
   * replayed.
   */
  setFrame(token: string, frame: CachedFrame) {
    let tokenFrames: ?Array<CachedFrame> = this.frameCache.get(token);
    if (tokenFrames) {
      tokenFrames = tokenFrames.concat([frame]);
    } else {
      tokenFrames = [frame];
    }
    this.frameCache.set(token, tokenFrames);
  }

  /**
   * Sets all the parameters for one or more streams when they are closed.
   * When the `close` request has been successfully processed,
   * `removeStreamClosingState` is called to clean up any closing state.
   */
  setStreamClosingState(
    streams: Array<SubscriptionIdentifier> | string,
    closeToken: string,
  ) {
    const closeCallback = (err, res, status) => {
      if (status && status.code === EOF_CODE) {
        this.removeStreamClosingState(streams, closeToken);
      }
    };

    if (Array.isArray(streams)) {
      const streamsLen = streams.length;
      for (let i = 0; i < streamsLen; i += 1) {
        const { token } = streams[i];
        this.closingStreams.set(token, closeToken);
      }
    } else {
      this.closingStreams.set(streams, closeToken);
    }

    this.eventsEmitter.bind(closeToken, closeCallback);
  }

  /**
   * Sends the command along with the params to the API, which creates a
   * subscriptions on the server.  It receives a stream of messages via the
   * provided callback, as these messages get produced.
   * The client can close the stream with returned close function, or use the
   * attached identifier (`closeFunction.identifier`) to close multiple streams
   * at once via `closeStream`.
   */
  stream(
    command: WsCommand,
    params: CloudVisionParams,
    callback: RawNotifCallback,
  ): SubscriptionCloseFunction {
    if (!this.isRunning) {
      callback('Connection is down', null);
      return null;
    }
    const token: string = makeToken(command, params);
    const callbackWithUnbind: EventCallback = (err, result, status) => {
      if (err) {
        // Unbind callback when any error message is received.
        // No need to send close to server because it will close them automatically.
        this.eventsEmitter.unbind(token, callbackWithUnbind);
      }
      if (status && status.code === ACTIVE_CODE) {
        this.activeStreams.add(token);
      }
      callback(err, result, status, token);
    };
    callbackWithUnbind.simple = callback.simple;
    const numCallbacks = this.eventsEmitter.bind(token, callbackWithUnbind);
    if (numCallbacks === 1) {
      // Only execute the request on the first callback.
      // If there are open request to the same data, just attach the callback
      const closingStreamToken = this.closingStreams.get(token);
      if (closingStreamToken) {
        // The stream is still closing, so wait for it to close before re requesting
        const streamsWaiting = this.waitingStreams.get(closingStreamToken) || [];
        streamsWaiting.push([token, command, params]);
        this.waitingStreams.set(closingStreamToken, streamsWaiting);
      } else {
        try {
          this.sendMessage(token, command, params);
        } catch (err) {
          console.error(err);
          callback(err, null);
          return null;
        }
      }
    } else if (this.activeStreams.has(token)) {
      // The stream is alread open immediatly call get
      callback(null, null, { code: ACTIVE_CODE }, token);
    }

    // return close function, unbinds subscription callback and sends close
    // once the last subscription callback is unbound
    const closeStreamFunc = () => {
      this.closeStream(CLOSE, token, callbackWithUnbind);
    };
    closeStreamFunc.identifier = { token, callback: callbackWithUnbind };
    return closeStreamFunc;
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
  unsafeGet(
    command: WsCommand,
    params: CloudVisionParams,
    callback: RawNotifCallback,
  ): string {
    const token: string = makeToken(command, params);
    // since this is of type request/response, we don't need
    // to listen to events anymore
    const callbackWithUnbind: EventCallback = (err, result, status) => {
      if (err) {
        // Unbind callback when any error message is received
        const n = this.eventsEmitter.unbind(token, callbackWithUnbind);
        if (n === 0) {
          // only remove frames once the last callback has been unbound
          this.removeFrame(token);
        }
      }
      callback(err, result, status, token);
    };
    callbackWithUnbind.simple = callback.simple;
    const numCallbacks = this.eventsEmitter.bind(token, callbackWithUnbind);
    if (numCallbacks === 1) {
      // Only execute the request on the first callback.
      // If there are open request to the same data, just attach the callback
      try {
        this.sendMessage(token, command, params);
      } catch (err) {
        console.error(err);
        this.eventsEmitter.unbind(token, callbackWithUnbind);
        callback(err, null);
      }
    } else {
      // Call the callback with the cached frames for the get
      const allFrames = this.getFrame(token);
      if (allFrames) {
        const allFramesLen = allFrames.length;
        for (let i = 0; i < allFramesLen; i += 1) {
          callback(null, allFrames[i].result, allFrames[i].status, token);
        }
      }
    }

    return token;
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
  pause(
    command: WsCommand,
    params: PauseParams,
    callback: RawNotifCallback,
  ) {
    if (!this.isRunning) {
      callback('Connection is down');
      return;
    }
    const token = makeToken(command, params);
    const callbackWithUnbind: EventCallback = (err, result, status) => {
      if (err) {
        // Unbind callback when any error is received
        this.eventsEmitter.unbind(token, callbackWithUnbind);
      }
      callback(err, null, status);
    };
    this.eventsEmitter.bind(token, callbackWithUnbind);

    try {
      this.sendMessage(token, command, params);
    } catch (err) {
      console.error(err);
      this.eventsEmitter.unbind(token, callbackWithUnbind);
      callback(err);
    }
  }
}

WRPC.CONNECTED = CONNECTED;
WRPC.DISCONNECTED = DISCONNECTED;

export default WRPC;
