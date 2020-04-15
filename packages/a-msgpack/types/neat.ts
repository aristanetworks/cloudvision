import { Bool, Float32, Float64, Int, Nil, Pointer, Str } from '../src/neat/NeatTypes';

export type Element = string | number | object | unknown[] | boolean;
export type PathElements = readonly Element[];

/**
 * The epoch timestamp in (milliseconds)
 */
export type EpochTimestamp = number;

export interface Timestamp {
  seconds: number;
  nanos?: number;
}

export type BaseType = Bool | Float32 | Float64 | Int | Nil | Pointer | Str | Map<unknown, unknown>;
export type NeatType = BaseType | Element;

export type NeatTypeClass =
  | typeof Bool
  | typeof Float32
  | typeof Float64
  | typeof Int
  | typeof Nil
  | typeof Pointer
  | typeof Str;
