/// <reference types="a-msgpack" />
import { Bool, Float32, Float64, Int, Nil, Pointer, Str } from './neatTypes';
export declare const NeatTypes: {
    Bool: typeof Bool;
    Float32: typeof Float32;
    Float64: typeof Float64;
    Int: typeof Int;
    Nil: typeof Nil;
    Pointer: typeof Pointer;
    Str: typeof Str;
};
export declare const Codec: import("a-msgpack").Codec;
/**
 * Returns the NEAT encoded version of the parameter `key`.
 *
 * @param key any value to encode.
 */
export declare function toBinaryKey(key: unknown): string;
/**
 * Returns the decoded value of a given base64, NEAT encoded string
 *
 * @param keyString base64, NEAT encoded value.
 */
export declare function fromBinaryKey(keyString: string): unknown;
