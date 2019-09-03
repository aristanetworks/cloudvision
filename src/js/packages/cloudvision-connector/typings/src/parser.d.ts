import { PathElements } from '../types/neat';
import { CloudVisionBatchedNotifications, CloudVisionMessage, CloudVisionNotifs, CloudVisionRawNotifs } from '../types/notifications';
import { Query } from '../types/params';
import { BatchPublishRequest, CloudVisionQueryMessage, PublishRequest } from '../types/query';
/**
 * Individually NEAT encodes path elements
 * @param pathElements an array of unencoded path elements
 * @returns an array of encoded path elements
 */
export declare function encodePathElements(pathElements: PathElements): string[];
/**
 * NEAT encodes the path elements and keys in a [[Query]].
 *
 * @returns the [[Query]] with encoded path elements and keys.
 */
export declare function encodePathElementsAndKeysInQuery(query: Query): Query;
/**
 * Decodes NEAT encoded path elements.
 *
 * @param pathElements an array of encoded path elements
 * @returns an array of path elements
 */
export declare function decodePathElements(pathElements: string[]): PathElements;
/**
 * Decodes the full result returned from the API server.
 *
 * @param result the raw notifications returned from the API server.
 * @param batchResults if `true`, notifications will be batched by their path elements.
 * otherwise the notifications will just be decoded and returned in the same format as
 * the server sends them.
 * @returns the decoded result returned from the server
 */
export declare function decodeNotifications(result: CloudVisionRawNotifs, batchResults: boolean): CloudVisionBatchedNotifications | CloudVisionNotifs;
/**
 * Encodes a full request that can be sent to the server.
 *
 * @param request an unencoded request.
 * @returns a NEAT encoded request that can be sent to the server.
 */
export declare function encodeNotifications(request: PublishRequest | BatchPublishRequest): CloudVisionRawNotifs;
/**
 * An implementation of a parser that enables communication with the server.
 * Implements stringify, so that requests can be sent to the server in the proper format.
 * Implements parse which decodes responses sent by the server.
 */
declare class Parser {
    static parse(data: string, batch: boolean): CloudVisionMessage;
    static stringify(message: CloudVisionQueryMessage): string;
    private static isQuery;
    private static isPublish;
}
export default Parser;
