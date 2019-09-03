import { NotifCallback, PlainObject, SubscriptionIdentifier, PublishCallback } from '../types';
import { CloudVisionBatchedResult, CloudVisionResult, CloudVisionServiceResult, CloudVisionStatus } from '../types/notifications';
import { CloseParams, CloudVisionParams, Query, SearchOptions, SearchType, WsCommand } from '../types/params';
import { Options, CloudVisionPublishRequest, ServiceRequest } from '../types/query';
import Emitter from './emitter';
interface ExplicitSearchOptions extends SearchOptions {
    searchType: SearchType;
}
export interface ExplicitOptions extends Options {
    start: number | undefined;
    end: number | undefined;
    versions?: number;
}
/**
 * Checks if an argument is valid (a number larger than 0).
 */
export declare function isValidArg(val?: number): val is number;
/**
 * Checks if a timestamp value is specified in microseconds.
 */
export declare function isMicroSeconds(val: number): boolean;
/**
 * Returns sanitized version of [[Options]].
 * It does a number of things:
 *  - If a timestamp is passed as a millisecond timestamp, it will
 *    be converted to microseconds.
 *  - If start, end and versions are invalid, the value for the
 *    option will be set as `undefined`
 * @param options a map of all **unsanitized** connector [[Options]]
 * @return a map of all [[Options]] with their **sanitized** values
 */
export declare function sanitizeOptions(options: Options): ExplicitOptions;
/**
 * Formats a message specifying all invalid params
 */
export declare function invalidParamMsg(start: number, end: number, versions?: number): string;
/**
 * Validates all [[Options]]. If validation passes, `true` will be returned.
 * If there are errors the callback ([[NotifCallback]]) is trigged with an error message.
 */
export declare function validateOptions(options: Options, callback: NotifCallback): boolean;
/**
 * Validates the [[Query]]. If validation passes `true` will be returned.
 * If there are errors the callback is trigged with an error message.
 */
export declare function validateQuery(query: Query, callback: NotifCallback, allowEmpty?: boolean): boolean;
/**
 * Creates a unique hash given an object.
 */
export declare function hashObject(object: PlainObject<unknown>): string;
/**
 * Generates token based on the [[WsCommand]] and params ([[CloudVisionParams]],
 * [[CloudVisionPublishRequest]], [[ServiceRequest]]) of a request. This is
 * used to map requests to responses when dispatching response callbacks.
 */
export declare function makeToken(command: WsCommand, params: CloudVisionParams | CloudVisionPublishRequest | ServiceRequest): string;
/**
 * Creates a notification callback that properly formats the result for the
 * passed callback.
 */
export declare function makeNotifCallback(callback: NotifCallback, options?: Options): NotifCallback;
/**
 * Creates the proper params for a [[Connector.close]] call. This will make sure that all
 * callbacks attached to the token are unbound before adding the token to the
 * close params.
 */
export declare function createCloseParams(streams: SubscriptionIdentifier[] | SubscriptionIdentifier, eventsMap: Emitter): CloseParams | null;
/**
 * Creates a publish callback that properly formats the result for the
 * passed callback. When the status code is [[EOF_CODE]], the callback will be
 * called with its first argument being `true`, indicating that the publish has
 * succeeded.
 * Otherwise the callback will be called with its first argument being `false`,
 * indicating that the publish has failed, and the second will contain the
 * error message.
 */
export declare function makePublishCallback(callback: PublishCallback): NotifCallback;
/**
 * Validates a response from the server. This will log any errors to the console
 * but will not attempt to fix the response.
 */
export declare function validateResponse(response: CloudVisionResult | CloudVisionBatchedResult | CloudVisionServiceResult, status: CloudVisionStatus | {}, token: string, batch: boolean): void;
/**
 * Returns sanitized version of [[SearchOptions]].
 *
 * If no search type is given, it will default to [[SEARCH_TYPE_ANY]].
 *
 * @param searchOptions a map of all **unsanitized** connector [[SearchOptions]]
 * @return a map of all [[SearchOptions]] with their **sanitized** values
 */
export declare function sanitizeSearchOptions(searchOptions: SearchOptions): ExplicitSearchOptions;
export {};
