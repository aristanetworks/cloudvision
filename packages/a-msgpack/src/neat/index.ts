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

import { ExtensionCodec } from '../ExtensionCodec';

import { Bool, Float32, Float64, Int, Nil, Pointer, Str, Wildcard } from './NeatTypes';
import { decodePointer, decodeWildcard, encodePointer, encodeWildcard } from './extensions';

export const POINTER_TYPE = 0;
export const WILDCARD_TYPE = 1;

export const NeatTypes = {
  Bool,
  Float32,
  Float64,
  Int,
  Nil,
  Pointer,
  Str,
  Wildcard,
};

export const Codec = new ExtensionCodec();

Codec.register({
  type: POINTER_TYPE,
  identifier: (data: unknown) => data instanceof Pointer,
  encode: encodePointer(Codec),
  decode: decodePointer(Codec),
});

Codec.register({
  type: WILDCARD_TYPE,
  identifier: (data: unknown) => data instanceof Wildcard,
  encode: encodeWildcard(),
  decode: decodeWildcard(),
});
