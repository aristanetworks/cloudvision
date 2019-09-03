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

import msgpack, { Decoder, TokenCreators } from 'a-msgpack';
import type { Codec } from 'a-msgpack';

import { decodeMap } from './customDecoders';
import { createMapEncoder, encodeObject, encodeString } from './customEncoders';

export function generateCodec(): Codec {
  const NEATCodec = new msgpack.Codec();

  NEATCodec.replaceWriteType('string', encodeString);
  NEATCodec.replaceWriteType('map', createMapEncoder(NEATCodec), true);
  NEATCodec.replaceWriteType('object', encodeObject, true);
  NEATCodec.replaceReadToken(0xc4, TokenCreators.flex, Decoder.uint8, Decoder.str);
  NEATCodec.replaceReadToken(0xc5, TokenCreators.flex, Decoder.uint16, Decoder.str);
  NEATCodec.replaceReadToken(0xc6, TokenCreators.flex, Decoder.uint32, Decoder.str);
  // fixmap -- 0x80 - 0x8f
  for (let i = 0x80; i <= 0x8f; ++i) {
    NEATCodec.replaceReadToken(i, TokenCreators.fix, i - 0x80, decodeMap, true);
  }
  NEATCodec.replaceReadToken(0xde, TokenCreators.flex, Decoder.uint16, decodeMap, true);
  NEATCodec.replaceReadToken(0xdf, TokenCreators.flex, Decoder.uint32, decodeMap, true);

  return NEATCodec;
}
