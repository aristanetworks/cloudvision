/* @flow */
// Copyright (c) 2018, Arista Networks, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software
// and associated documentation files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all copies or
// substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import { Bool, Float64, Int, Nil, Str } from './types';

type BaseType = Bool | Float64 | Int | Str | Nil | Map<mixed, mixed>;

export function createBaseType(value: mixed): BaseType {
  if (typeof value === 'number') {
    const decimals = value.toString().split('.');
    if (decimals.length > 1) {
      return new Float64(value);
    }

    return new Int(value);
  }

  if (typeof value === 'boolean') {
    return new Bool(value);
  }

  if (typeof value === 'string') {
    return new Str(value);
  }

  if (value && typeof value === 'object') {
    return createTypedMap(value); // eslint-disable-line no-use-before-define
  }

  return new Nil();
}

export function createTypedMap(object: {}): Map<mixed, mixed> {
  const map: Map<mixed, mixed> = new Map();
  const keys = Object.keys(object);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    const value = object[key];
    const keyType = createBaseType(key);
    const valueType = createBaseType(value);

    map.set(keyType, valueType);
  }

  return map;
}
