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

import msgpack, { BufferUtils, Encoder, Headers } from 'a-msgpack';
import type { Codec, Paper } from 'a-msgpack';
import JSBI from 'jsbi';

import { Bool, Float32, Float64, Int, Nil, Str } from './types';
import { sortMapByKey } from './utils';

export function encodeString(encoder: Paper, value: string) {
  Encoder.bin(encoder, BufferUtils.fromString(value));
}

type Encode = (Paper, mixed) => Uint8Array;

function encodeMapType(codec: Codec, encode: Encode, encoder: Paper, map: Map<mixed, mixed>) {
  const length = map.size;
  const sortedMap: Array<Array<any>> = [];
  // fixmap -- 0x80 - 0x8f
  // map 16 -- 0xde
  // map 32 -- 0xdf
  if (length < 16) {
    Headers.type(encoder, 0x80 + length);
  } else if (length <= 0xffff) {
    Headers.int16(encoder, 0xde, length);
  } else {
    Headers.int32(encoder, 0xdf, length);
  }
  map.forEach((value, key) => {
    const encodedKey: Uint8Array = msgpack.encode(key, codec);
    sortedMap.push([encodedKey, value]);
  });

  sortedMap.sort(sortMapByKey);

  sortedMap.forEach((keyVal) => {
    encoder.send(keyVal[0]);
    encode(encoder, keyVal[1]);
  });
}

export function encodeObject(encode: Encode, encoder: Paper, value: mixed): mixed {
  if (value === null) {
    return Encoder.nil(encoder, value);
  }
  if (Array.isArray(value)) {
    if (value instanceof JSBI) {
      return Encoder.jsBi(encode, encoder, value);
    }
    return Encoder.array(encode, encoder, value);
  }
  if (value instanceof Uint8Array) {
    return Encoder.bin(encoder, value);
  }

  // float 32 -- 0xca
  if (value instanceof Float32) {
    return Headers.float32(encoder, value.value);
  }

  // float 64 -- 0xcb
  if (value instanceof Float64) {
    return Headers.float64(encoder, value.value);
  }

  // int
  if (value instanceof Int) {
    // $FlowFixMe
    if (typeof value.value === 'bigint') {
      return Encoder.bigint(encode, encoder, value.value);
    }
    if (value.value instanceof JSBI) {
      return Encoder.jsBi(encode, encoder, value.value);
    }
    return Encoder.int(encoder, value.value);
  }

  // string
  if (value instanceof Str) {
    return encoder.codec.writeType.string(encoder, value.value);
  }

  // bool
  if (value instanceof Bool) {
    return encoder.codec.writeType.boolean(encoder, value.value);
  }

  // nil
  if (value instanceof Nil) {
    return encoder.codec.writeType.null(encoder);
  }

  const packer = encoder.codec._packerFor(value); // eslint-disable-line no-underscore-dangle
  if (packer) {
    return Encoder.ext(encoder, packer(value));
  }

  return encoder.codec.writeType.map(encoder, value);
}

/**
 * NEAT maps are sorted by the binary value of each key.
 */
function encodeMap(codec: Codec, encode: Encode, encoder: Paper, map: {} | Map<mixed, mixed>) {
  if (map instanceof Map) {
    encodeMapType(codec, encode, encoder, map);
  } else {
    // $FlowFixMe this will always be an object with string keys
    encodeMapType(codec, encode, encoder, new Map(Object.entries(map)));
  }
}

export function createMapEncoder(codec: Codec) {
  return (encode: Encode, encoder: Paper, object: {} | Map<mixed, mixed>) =>
    encodeMap(codec, encode, encoder, object);
}
