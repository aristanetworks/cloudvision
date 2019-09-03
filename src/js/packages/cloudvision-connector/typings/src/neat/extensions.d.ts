import { Codec } from 'a-msgpack';
import { Pointer } from './neatTypes';
declare type PointerEncoder = (data: Pointer) => Uint8Array;
declare type PointerDecoder = (buffer: Uint8Array) => Pointer;
export declare function encodePointer(codec: Codec): PointerEncoder;
export declare function decodePointer(codec: Codec): PointerDecoder;
export {};
