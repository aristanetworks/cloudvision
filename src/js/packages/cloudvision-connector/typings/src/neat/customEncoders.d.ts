import { Codec, Encode, Paper } from 'a-msgpack';
import { PlainObject } from '../../types';
declare type MapEncoder = (encode: Encode, encoder: Paper, object: PlainObject<unknown> | Map<unknown, unknown>) => void;
export declare function encodeString(encoder: Paper, value: string): void;
export declare function encodeObject(encode: Encode, encoder: Paper, value: unknown): unknown;
export declare function createMapEncoder(codec: Codec): MapEncoder;
export {};
