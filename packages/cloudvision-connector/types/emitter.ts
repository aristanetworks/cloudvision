import { EventCallback, RequestContext } from './connection';

export type EmitterEvents = Map<string, EventCallback[]>;

export type EmitterRequestContext = Map<string, RequestContext>;
