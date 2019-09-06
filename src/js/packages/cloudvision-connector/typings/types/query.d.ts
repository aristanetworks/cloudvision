import { EpochTimestamp, PathElements, Timestamp } from './neat';
import { CloudVisionDatapoint, CloudVisionNotification } from './notifications';
import { CloudVisionParams, DatasetObject, WsCommand } from './params';
/**
 * Please refer to the [[CloudVisionNotification]] definition.
 */
declare type PublishNotification = CloudVisionNotification<PathElements, Timestamp, CloudVisionDatapoint<unknown, unknown>[], unknown[]>;
/**
 * The request type of a publish command.
 *
 * @dataset is the root of the path.
 * @notifications is the data to write to. For the type
 */
export interface PublishRequest {
    dataset: DatasetObject;
    notifications: PublishNotification[];
}
export interface BatchPublishRequest {
    dataset: DatasetObject;
    notifications: {
        [path: string]: PublishNotification[];
    };
}
/**
 * There are a number of options you can supply which limit the scope of
 * the [[Query]]. Options are passed as an object, where the key is the
 * name of the option and the value is the value for that option.
 *
 * There are different combinations of options that are valid, each of them is
 * listed below.
 *
 * @example
 * ```typescript
 *
 * // Range query (returns one or more data points)
 * {
 *   start: 1505760134000,
 *   end: 1505760184000,
 * }
 *
 * // Point in time query (returns exactly one data point)
 * {
 *   end: 1505760184000,
 * }
 *
 * // Limit query (returns `versions` + 1 number of data points)
 * {
 *   versions: 1,
 *   end: 1505760184000,
 * }
 * ```
 */
export interface Options {
    start?: EpochTimestamp;
    end?: EpochTimestamp;
    versions?: number;
}
export interface CloudVisionPublishRequest {
    sync: boolean;
    batch: PublishRequest | BatchPublishRequest;
}
export interface CloudVisionQueryMessage {
    token: string;
    command: WsCommand;
    params: CloudVisionParams | CloudVisionPublishRequest | ServiceRequest;
}
export interface ServiceRequest {
    service: string;
    method: string;
    body: {};
}
export {};
