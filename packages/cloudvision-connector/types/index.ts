import {
  CloudVisionBatchedResult,
  CloudVisionResult,
  CloudVisionServiceResult,
  CloudVisionStatus,
} from './notifications';
import { WsCommand } from './params';

export { BaseType, Element, NeatType, NeatTypeClass, PathElements, Timestamp } from 'a-msgpack';

export interface PlainObject<T> {
  [key: string]: T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventCallback = (requestArgs: RequestArgs | undefined, ...args: any[]) => void;
export interface RequestArgs {
  command: WsCommand | 'connection';
}

export type ConnectionCallback = (connEvent: string, wsEvent: Event) => void;

export type PublishCallback = (success: boolean, err?: string) => void;

/**
 * Uniquely identifies a `stream` (subscribe) call. Tokens are created based of the command
 * and request params, so identical calls with have identical tokens. This
 * means we use the callback to identify the call, if there are multiple of
 * the same calls.
 */
export interface SubscriptionIdentifier {
  token: string;
  callback: EventCallback;
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
export type NotifCallback = (
  err: string | null,
  result?: CloudVisionBatchedResult | CloudVisionResult | CloudVisionServiceResult,
  status?: CloudVisionStatus,
  token?: string,
  requestArgs?: RequestArgs,
) => void;

export type ERROR = 'ERROR';
export type INFO = 'INFO';
export type WARN = 'WARN';
export type LogLevels = WARN | ERROR | INFO;

export {
  CloudVisionDatapoint,
  CloudVisionDelete,
  CloudVisionMessage,
  CloudVisionNotification,
  CloudVisionNotifs,
  CloudVisionRawNotifs,
  CloudVisionUpdate,
  ConvertedNotification,
  NewConvertedNotification,
  RawNotification,
} from './notifications';
export { PathObject, Query, SearchType } from './params';
export { CloudVisionQueryMessage } from './query';
