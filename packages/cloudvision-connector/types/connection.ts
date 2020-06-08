import { WsCommand } from './params';

export interface EventCallback {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (requestContext: RequestContext, ...args: any[]): void;
}

export type ContextCommand = WsCommand | 'connection' | 'NO_COMMAND';

export interface RequestContext {
  command: ContextCommand;
  encodedParams: string;
  token: string;
}

export interface ConnectionCallback {
  (connEvent: string, wsEvent: Event): void;
}

/**
 * Uniquely identifies a `stream` (subscribe) call. Tokens are created based of the command
 * and request params, so identical calls with have identical tokens. This
 * means we use the callback to identify the call, if there are multiple of
 * the same calls.
 */
export interface SubscriptionIdentifier {
  callback: EventCallback;
  token: string;
}
