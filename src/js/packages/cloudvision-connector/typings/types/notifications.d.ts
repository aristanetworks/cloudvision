import { PathElements, Timestamp } from './neat';
import { DatasetObject } from './params';
export interface CloudVisionDatasets {
    datasets: DatasetObject[];
}
export interface CloudVisionStatus {
    code: number;
    message?: string;
}
export interface CloudVisionDatapoint<K, V> {
    key: K;
    value: V;
}
export interface CloudVisionNotification<PE, T, U, D> {
    path_elements?: PE;
    timestamp: T;
    updates?: U;
    deletes?: D;
    delete_all?: boolean;
}
export interface CloudVisionUpdate<K, V> {
    [key: string]: CloudVisionDatapoint<K, V>;
}
export interface CloudVisionDelete<T> {
    [key: string]: T;
}
export declare type ConvertedNotification = CloudVisionNotification<PathElements, number, CloudVisionUpdate<unknown, unknown>, CloudVisionDelete<unknown>>;
export declare type RawNotification = CloudVisionNotification<string[], Timestamp, CloudVisionDatapoint<string, string>[], string[]>;
export interface CloudVisionNotifs {
    dataset: DatasetObject;
    notifications: ConvertedNotification[];
}
export interface CloudVisionRawNotifs {
    dataset: DatasetObject;
    notifications: RawNotification[];
}
export interface CloudVisionBatchedNotifications {
    dataset: DatasetObject;
    notifications: {
        [path: string]: ConvertedNotification[];
    };
}
export interface CloudVisionServiceResult {
    [key: string]: unknown;
}
/**
 * This can either be the update returned as query result, or update to write
 * to the CloudVision API server.
 */
export declare type CloudVisionResult = CloudVisionNotifs | CloudVisionDatasets;
export declare type CloudVisionBatchedResult = CloudVisionBatchedNotifications | CloudVisionDatasets;
export interface CloudVisionMessage {
    error?: string;
    result: CloudVisionBatchedResult | CloudVisionResult | CloudVisionServiceResult;
    status: CloudVisionStatus;
    token: string;
}
