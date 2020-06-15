type ObjectValue<T> = T[keyof T];

export interface Encoder {
  (value: unknown): string;
}

export interface Decoder {
  (value: string): unknown;
}

export interface MessageDefinition {
  request: unknown;
  response: unknown;
}

export interface MessageDefinitions {
  [messageType: string]: MessageDefinition;
}

export type MessageType<I extends MessageDefinitions> = Extract<keyof I, string>;

export type MessageDefinitionsRequest<I extends MessageDefinitions> = ObjectValue<I>['request'];

export type MessageDefinitionsResponse<I extends MessageDefinitions> = ObjectValue<I>['response'];

interface MessageBase {
  requestId: string;
}

export interface MessageRequest<T extends string, D> extends MessageBase {
  data: D;
  type: T;
}

export interface MessageResponseSuccess<D> extends MessageBase {
  data: D;
}

export interface MessageResponseError extends MessageBase {
  error: string;
}

export type MessageResponse<D> = MessageResponseSuccess<D> | MessageResponseError;

export interface RequestHandler<T extends MessageDefinition> {
  (data: T['request']): T['response'] | Promise<T['response']>;
}
