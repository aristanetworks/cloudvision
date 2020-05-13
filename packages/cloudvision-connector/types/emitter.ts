import { EventCallback, RequestArgs } from './connection';

export type EmitterEvents = Map<string, EventCallback[]>;

export type EmitterRequestArgs = Map<string, RequestArgs>;
