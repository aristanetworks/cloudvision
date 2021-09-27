import JSBI from 'jsbi';

import { BasicNeatType } from '../../types/neat';
import { Bool, Float32, Float64, Int, Str } from '../neat/NeatTypes';

/**
 * Check if a value looks like a JSBI value.
 */
export function isJsbi(value: unknown): value is JSBI {
  // if it has __clzmsd it's probably jsbi
  return Array.isArray(value) && '__clzmsd' in value;
}

export function isFloat32(value: BasicNeatType): value is Float32 {
  return value.type === 'float32';
}

export function isFloat64(value: BasicNeatType): value is Float64 {
  return value.type === 'float64';
}

export function isInt(value: BasicNeatType): value is Int {
  return value.type === 'int';
}

export function isStr(value: BasicNeatType): value is Str {
  return value.type === 'str';
}

export function isBool(value: BasicNeatType): value is Bool {
  return value.type === 'bool';
}

export function isPlainObject(object: {}): boolean {
  if (Object.getPrototypeOf(object) === null) {
    return true;
  }
  let proto = object;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(object) === proto;
}
