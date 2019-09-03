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

import type { Paper } from 'a-msgpack';
import { fromByteArray } from 'base64-js';

type Decode = (Paper) => mixed;

export function decodeMap(decode: Decode, decoder: Paper, len: number): { [key: string]: string } {
  const obj = {};
  for (let i = 0; i < len; ++i) {
    // decoode the key. Get the offsets, so we can get the binary representation
    // in the event of a complex key.
    const preOffset = decoder.offset;
    let key = decode(decoder);
    const postOffset = decoder.offset;

    // decoode the value
    let value = decode(decoder);

    if (typeof key !== 'string') {
      // use the binary representation as the key and return an _key _value
      // object with the values for the decoded key and value.
      // This is a workaround for when keys aren't strings, since object key must
      // always be strings.
      const decodedKey = key;
      key = fromByteArray(decoder.buffer.slice(preOffset, postOffset));
      value = {
        _key: decodedKey,
        _value: value,
      };
    }

    obj[key] = value;
  }
  return obj;
}
