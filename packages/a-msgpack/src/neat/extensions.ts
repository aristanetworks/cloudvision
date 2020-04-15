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
import { decode } from '../decode';
import { encode } from '../encode';

import { Pointer } from './NeatTypes';

type PointerEncoder = (data: unknown) => Uint8Array | null;
type PointerDecoder = (buffer: Uint8Array) => Pointer;

export function encodePointer(codec: ExtensionCodec): PointerEncoder {
  return (data: unknown): Uint8Array | null => {
    if (data instanceof Pointer) {
      return encode(data.value, { extensionCodec: codec });
    }
    return null;
  };
}

export function decodePointer(codec: ExtensionCodec): PointerDecoder {
  return (buffer: Uint8Array): Pointer => {
    const pointer = decode(buffer, { extensionCodec: codec });
    if (Array.isArray(pointer)) {
      return new Pointer(pointer);
    }
    return new Pointer();
  };
}
