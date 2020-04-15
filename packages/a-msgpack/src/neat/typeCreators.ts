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

import { PlainObject } from '../../types';
import { BaseType } from '../../types/neat';

import { Bool, Float64, Int, Nil, Str } from './NeatTypes';

export function createBaseType(value: unknown): BaseType {
  const type = typeof value;
  if (type === 'number') {
    const decimals = String(value).split('.');
    if (decimals.length > 1) {
      return new Float64(value);
    }

    return new Int(value);
  }

  if (type === 'boolean') {
    return new Bool(value);
  }

  if (type === 'string') {
    return new Str(value);
  }

  if (value !== null && type === 'object') {
    let proto = value;
    while (Object.getPrototypeOf(proto) !== null) {
      proto = Object.getPrototypeOf(proto);
    }
    if (Object.getPrototypeOf(value) === proto) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return createTypedMap(value as PlainObject<unknown>);
    }
  }

  return new Nil();
}

export function createTypedMap(object: PlainObject<unknown>): Map<BaseType, BaseType> {
  const map = new Map();
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
