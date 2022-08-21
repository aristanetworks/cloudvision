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

import { Pointer, Wildcard } from './NeatTypes';

type PointerEncoder = (data: Pointer) => Uint8Array;
type PointerDecoder = (buffer: Uint8Array) => Pointer;
type WildcardEncoder = () => Uint8Array;
type WildcardDecoder = () => Wildcard;

export function encodePointer(codec: ExtensionCodec): PointerEncoder {
  return (data: Pointer): Uint8Array => {
    return encode(data.value, { extensionCodec: codec });
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

export function encodeWildcard(): WildcardEncoder {
  return (): Uint8Array => {
    return new Uint8Array();
  };
}

export function decodeWildcard(): WildcardDecoder {
  return (): Wildcard => {
    return new Wildcard();
  };
}
