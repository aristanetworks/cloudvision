import { NotifCallback, PublishCallback, SubscriptionIdentifier } from '../types';
import { CloudVisionParams, DatasetCommand, Query, SearchOptions, WsCommand } from '../types/params';
import { Options, PublishRequest, ServiceRequest } from '../types/query';
import WRPC from './wrpc';
/**
 * The Connector uses WebSocket to enable transmission of data over an
 * open connection with the CloudVision API server.
 * It supports subscriptions, which allows clients to receive streaming
 * updates as data changes in real-time.
 */
declare class Connector extends WRPC {
    static CLOSE: string;
    static DEVICES_DATASET_ID: DatasetCommand;
    static GET_DATASETS: WsCommand;
    static GET: WsCommand;
    static PAUSE: WsCommand;
    static PUBLISH: WsCommand;
    static SEARCH_SUBSCRIBE: WsCommand;
    static SEARCH: WsCommand;
    static SUBSCRIBE: WsCommand;
    /**
     * Close multiple subscriptions in one `close` call. The subscription
     * identifier return in the `subscribe` call along with the close function
     * can be passed in here to close the subscription together with others.
     *
     * @example
     * ```typescript
     *
     * const query = [{
     *   dataset: {
     *     type: 'app',
     *     name: 'analytics'
     *   },
     *   paths: [{
     *     path_elements: ['events', 'activeEvents'],
     *   }],
     * }];
     * const handleResponse = (err, res) => {...};
     *
     * // Send the request
     * const subscriptionCloseFn = connector.subscribe(query, handleResponse);
     *
     * // Close the subscription via `closeSubscriptions`
     * const closeSubscriptions([subscriptionCloseFn.identifier]);
     * ```
     */
    closeSubscriptions(subscriptions: SubscriptionIdentifier[], callback: NotifCallback): string | null;
    /**
     * Returns all notifications that match the given [[Query]] and [[Options]], in
     * addition to subscribing to updates. This will return notifications as
     * new updates to the data requested come in.
     *
     * A `getAndSubscribe` is done in such a way that no notifications are lost.
     * Before doing a `get`, a `subscribe` is initiated and we wait for an active
     * status message to be returned before initiating a `get`. This means no notifications
     * are missed, but there is a chance of duplicate notifications.
     *
     * @example
     * ```typescript
     *
     * const query = [{
     *   dataset: {
     *     type: 'app',
     *     name: 'analytics'
     *   },
     *   paths: [{
     *     path_elements: ['events', 'activeEvents'],
     *   }],
     * }];
     * const options = {
     *   start: 1504113817725,
     *   end: 1504113917725,
     * };
     * const handleResponse = (err, res) => {...};
     *
     * // open the stream
     * const closeSubscription = connector.getAndSubscribe(
     *   query, handleResponse, options);
     *
     * closeSubscription(); // close the stream when finished
     * ```
     */
    getAndSubscribe(query: Query, callback: NotifCallback, options: Options): {
        subscribe: SubscriptionIdentifier | null;
        get: string;
    } | null;
    /**
     * Returns a list of apps (datasets with type == 'app').
     */
    getApps(callback: NotifCallback): string | null;
    /**
     * Returns a list of datasets. This will return data sets of type 'device',
     * as well as type 'app'.
     */
    getDatasets(callback: NotifCallback): string | null;
    /**
     * Returns a list of devices (datasets with type == 'device').
     */
    getDevices(callback: NotifCallback): string | null;
    /**
     * Generates the unique token that the request can be referenced by.
     */
    getCommandToken(command: WsCommand, params: CloudVisionParams): string;
    /**
     * Returns all notifications that match the given query and options.
     *
     * @example
     * ```typescript
     *
     * const query = [{
     *   dataset: {
     *     type: 'app',
     *     name: 'analytics'
     *   },
     *   paths: [{
     *     path_elements: ['events', 'activeEvents'],
     *   }],
     * }];
     * const options = {
     *   start: 1504113817725,
     *   end: 1504113917725,
     * };
     * const handleResponse = (err, res) => {...};
     *
     * // Send the request
     * connector.getWithOptions(query, handleResponse, options);
     * ```
     */
    getWithOptions(query: Query | DatasetCommand, callback: NotifCallback, options: Options): string | null;
    runService(request: ServiceRequest, callback: NotifCallback): void;
    searchWithOptions(query: Query, callback: NotifCallback, options: Options & SearchOptions): string | null;
    searchSubscribe(query: Query, callback: NotifCallback, options?: SearchOptions): SubscriptionIdentifier | null;
    /**
     * Creates a subscription to the given query, which will return
     * notifications as they happen. Note that this will not return any
     * historical data. The first update that is sent will be when the state
     * of the data in the query changes.
     *
     * @example
     * ```typescript
     *
     * const query = [{
     *   dataset: {
     *     type: 'app',
     *     name: 'analytics'
     *   },
     *   paths: [{
     *     path_elements: ['events', 'activeEvents'],
     *   }],
     * }];
     * const handleResponse = (err, res) => {...};
     *
     * // Send the request
     * const subscriptionCloseFn = connector.subscribe(query, handleResponse);
     * ```
     */
    subscribe(query: Query, callback: NotifCallback): SubscriptionIdentifier | null;
    /**
     * Write data to the CloudVision API server, where the update is a
     * series of notifications of a certain dataset.
     *
     * The writeSync operation is synchronous.
     */
    writeSync(publishRequest: PublishRequest, callback: PublishCallback): void;
}
export default Connector;
export { ACTIVE_CODE, EOF_CODE } from './constants';
export { fromBinaryKey, NeatTypes, toBinaryKey } from './neat';
export { createBaseType } from './neat/typeCreators';
export { default as Parser } from './parser';
