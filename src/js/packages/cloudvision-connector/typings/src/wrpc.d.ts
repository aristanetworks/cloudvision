import { ConnectionCallback, NotifCallback, SubscriptionIdentifier } from '../types';
import { GetCommands, StreamCommands, CloudVisionParams } from '../types/params';
import { CloudVisionPublishRequest, ServiceRequest } from '../types/query';
import Emitter from './emitter';
import Parser from './parser';
/**
 * Options passed to the constructor, that configure some global options
 *
 * `pauseStreams`: Negotiates the enabling of pause/resume with the server.
 *    Pause/resume is a way to add backpressure to the server, so that it stops
 *    sending notifications when the client cannot keep up.
 */
interface ConnectorOptions {
    pauseStreams: boolean;
    batchResults: boolean;
    debugMode: boolean;
}
/**
 * Wraps a given WebSocket with CloudVision API streaming and data quering
 * methods.
 */
declare class WRPC {
    static CONNECTED: string;
    static DISCONNECTED: string;
    private closingStreams;
    private connectionEvents;
    private connectorOptions;
    private events;
    isRunning: boolean;
    private Parser;
    private waitingStreams;
    private activeStreams;
    private activeRequests;
    private ws;
    private WebSocket;
    constructor(options?: ConnectorOptions, websocketClass?: typeof WebSocket, parser?: typeof Parser);
    readonly websocket: WebSocket;
    readonly connectionEmitter: Emitter;
    readonly eventsEmitter: Emitter;
    readonly streams: Set<string>;
    readonly streamInClosingState: Map<string, string>;
    private addWaitingStream;
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
    private callCommand;
    /**
     * Closes connection to the server and cleans up all event emitters.
     * All bound callbacks will be unbound.
     */
    close(): void;
    private closeWs;
    private closeCommand;
    /**
     * Closes multiple streams in one `close` call.
     */
    closeStreams(streams: SubscriptionIdentifier[], callback: NotifCallback): string | null;
    /**
     * Closes one single stream.
     */
    closeStream(stream: SubscriptionIdentifier, callback: NotifCallback): string | null;
    /**
     * Subscribes a callback to connection events.
     * The callback can receive either `WRPC.CONNECTED or `WRPC.DISCONNECTED`.
     */
    connection(callback: ConnectionCallback): () => void;
    /**
     * Enables any session wide options by negotiating with the server
     */
    private enableOptions;
    /**
     * Sends the command along with the params to the API, if the WebSocket is
     * connected. The response is received via the provided callback function.
     */
    get(command: GetCommands, params: CloudVisionParams, callback: NotifCallback): string | null;
    private makeCallbackWithUnbind;
    private makeQueuedCallbackWithUnbind;
    /**
     * Writes data in params to the CloudVision API. It receives one message via
     * the provided callback, to indicate whether the write is successful or not.
     */
    publish(params: CloudVisionPublishRequest, callback: NotifCallback): string | null;
    /**
     * Cleans up the steam closing state set in `setStreamClosingState`, as well
     * as re-subscribing to any streams (with the same token as the stream that
     * was just closed) opened up during the closing of the current stream.
     */
    private removeStreamClosingState;
    /**
     * Send a service request command to the CloudVision API
     */
    requestService(request: ServiceRequest, callback: NotifCallback): string | null;
    /**
     * Re initiates a subscribe if there has been a `subscribe` call for the
     * stream while the stream was closing.
     */
    private reSubscribeStream;
    /**
     * PRIVATE METHOD
     * Requests the server to resume one of the currently paused streams.
     */
    private resume;
    /**
     * Run connects connector to the specified url
     */
    run(url: string): void;
    /**
     * PRIVATE METHOD
     * Sets the specified WebSocket on the class and binds `onopen`, `onclose`, and
     * `onmessage` listeners.
     *
     * - onopen: The `WRPC.CONNECTED` event is emitted, and the WebSocket is set
     * to isRunning equals `true`.
     * - onclose: The `WRPC.DISCONNECTED` event is emitted, and the WebSocket is
     * set to isRunning equals `false`.
     * - onmessage: The message is parsed and the event type `msg.token` is
     * emitted. This results in the calling of all callbacks bound to that event
     * type.
     */
    private runWithWs;
    search(params: CloudVisionParams, callback: NotifCallback): string | null;
    /**
     * Sends a message on the WebSocket with the proper parameters, so that the
     * CloudVision API can respond accordingly.
     */
    private sendMessage;
    private sendMessageOrError;
    /**
     * Sets all the parameters for one or more streams when they are closed.
     * When the `close` request has been successfully processed,
     * `removeStreamClosingState` is called to clean up any closing state.
     */
    private setStreamClosingState;
    /**
     * Sends the command along with the params to the API, which creates a
     * subscriptions on the server.  It receives a stream of messages via the
     * provided callback, as these messages get produced.
     * The client can close the stream with returned close function, or use the
     * attached identifier (`closeFunction.identifier`) to close multiple streams
     * at once via `closeStream`.
     */
    stream(command: StreamCommands, params: CloudVisionParams, callback: NotifCallback): SubscriptionIdentifier | null;
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
    private pause;
}
export default WRPC;
