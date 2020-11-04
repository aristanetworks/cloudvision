import { PathElements, Timestamp } from 'a-msgpack';

import { RequestContext } from './connection';
import { DatasetObject } from './params';

export interface CloudVisionMetaData<V> {
  [key: string]: V;
}

export interface CloudVisionDatasets {
  metadata: CloudVisionMetaData<unknown>;
  datasets: DatasetObject[];
}

export interface CloudVisionStatus {
  code?: number;

  message?: string;
}

export interface CloudVisionDatapoint<K, V> {
  key: K;
  value: V;
}

export interface CloudVisionNotification<PE, T, U, D> {
  timestamp: T;

  delete_all?: boolean;
  deletes?: D;
  path_elements?: PE;
  updates?: U;
}

export interface CloudVisionUpdates<K, V> {
  [key: string]: CloudVisionDatapoint<K, V>;
}

/** @deprecated: Use `CloudVisionUpdates`. */
export type CloudVisionUpdate<K, V> = CloudVisionUpdates<K, V>;

export interface CloudVisionDeletes<K> {
  [key: string]: { key: K };
}

/** @deprecated: Use `CloudVisionDeletes`. */
export type CloudVisionDelete<K> = CloudVisionDeletes<K>;

export type ConvertedNotification<K = unknown, V = unknown> = CloudVisionNotification<
  PathElements,
  number,
  CloudVisionUpdates<K, V>,
  CloudVisionDeletes<K>
>;

export type NewConvertedNotification<K = unknown, V = unknown> = CloudVisionNotification<
  PathElements,
  Timestamp,
  CloudVisionDatapoint<K, V>[],
  K[]
>;

export type RawNotification = CloudVisionNotification<
  string[],
  Timestamp,
  CloudVisionDatapoint<string, string>[],
  string[]
>;

export interface CloudVisionNotifs {
  dataset: DatasetObject;
  metadata: CloudVisionMetaData<unknown>;
  notifications: ConvertedNotification[];
}

export interface CloudVisionRawNotifs {
  dataset: DatasetObject;
  metadata?: CloudVisionMetaData<unknown>;
  notifications: RawNotification[];
}

export interface CloudVisionBatchedNotifications {
  dataset: DatasetObject;
  metadata: CloudVisionMetaData<unknown>;
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
export type CloudVisionResult = CloudVisionNotifs | CloudVisionDatasets;
export type CloudVisionBatchedResult = CloudVisionBatchedNotifications | CloudVisionDatasets;

export interface CloudVisionMessage {
  result: CloudVisionBatchedResult | CloudVisionResult | CloudVisionServiceResult;
  status: CloudVisionStatus;
  token: string;

  error?: string;
}

/**
 * A function that gets called when a notification associated with the [[Query]] is
 * received.
 *
 * @param error `null` if there is no error. If there is an error this will be the message
 * @param result if there is a result in the notification this will be defined
 * @param status if there is a status in the notification this will be defined
 * @param token the token associated with the notification. If not defined, then there is
 * no notification associated with the call.
 */
export interface NotifCallback {
  (
    err: string | null,
    result?: CloudVisionBatchedResult | CloudVisionResult | CloudVisionServiceResult,
    status?: CloudVisionStatus,
    token?: string,
    requestContext?: RequestContext,
  ): void;
}
