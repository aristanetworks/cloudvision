import { EventCallback, RequestArgs } from '.';

export type EmitterEvents = Map<string, EventCallback[]>;
export type EmitterRequestArgs = Map<string, RequestArgs>;
