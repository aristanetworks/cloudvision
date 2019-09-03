import { Bool, Float64, Int, Nil, Str } from '../src/neat/neatTypes';
export declare type Element = string | number | object | unknown[] | boolean;
export declare type PathElements = readonly Element[];
/**
 * The epoch timestamp in (milliseconds)
 */
export declare type EpochTimestamp = number;
export interface Timestamp {
    seconds: number;
    nanos?: number;
}
export declare type BaseType = Bool | Float64 | Int | Str | Nil | Map<unknown, unknown>;
