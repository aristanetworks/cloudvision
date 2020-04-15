import JSBI from 'jsbi';

import { NeatType } from '../types/neat';

import { ExtData } from './ExtData';
import { ExtensionCodec, ExtensionCodecType } from './ExtensionCodec';
import { Bool, Float32, Float64, Int, Str } from './neat/NeatTypes';
import { isNeatType, sortMapByKey } from './neat/utils';
import { isJsbi } from './utils/data';
import { setInt64, setUint64 } from './utils/int';
import { ensureUint8Array } from './utils/typedArrays';
import {
  utf8EncodeJs,
  utf8Count,
  TEXT_ENCODING_AVAILABLE,
  TEXT_ENCODER_THRESHOLD,
  utf8EncodeTE,
} from './utils/utf8';

export const DEFAULT_MAX_DEPTH = 100;
export const DEFAULT_INITIAL_BUFFER_SIZE = 2048;

export class Encoder {
  private pos = 0;

  private view: DataView;

  private bytes: Uint8Array;

  readonly extensionCodec: ExtensionCodecType;

  readonly maxDepth: number;

  readonly initialBufferSize: number;

  constructor(
    extensionCodec = ExtensionCodec.defaultCodec,
    maxDepth = DEFAULT_MAX_DEPTH,
    initialBufferSize = DEFAULT_INITIAL_BUFFER_SIZE,
  ) {
    this.extensionCodec = extensionCodec;
    this.maxDepth = maxDepth;
    this.initialBufferSize = initialBufferSize;
    this.view = new DataView(new ArrayBuffer(this.initialBufferSize));
    this.bytes = new Uint8Array(this.view.buffer);
  }

  keyEncoder(value: unknown, depth: number): Uint8Array {
    const encoder = new Encoder(this.extensionCodec, this.maxDepth, this.initialBufferSize);

    encoder.encode(value, depth);
    return encoder.getUint8Array();
  }

  encode(object: unknown, depth: number): void {
    if (depth > this.maxDepth) {
      throw new Error(`Too deep objects in depth ${depth}`);
    }

    if (object == null) {
      this.encodeNil();
    } else if (typeof object === 'boolean') {
      this.encodeBoolean(object);
    } else if (typeof object === 'number') {
      this.encodeNumber(object);
    } else if (typeof object === 'string') {
      this.encodeString(object);
    } else {
      this.encodeObject(object, depth);
    }
  }

  getUint8Array(): Uint8Array {
    return this.bytes.subarray(0, this.pos);
  }

  ensureBufferSizeToWrite(sizeToWrite: number): void {
    const requiredSize = this.pos + sizeToWrite;

    if (this.view.byteLength < requiredSize) {
      this.resizeBuffer(requiredSize * 2);
    }
  }

  resizeBuffer(newSize: number): void {
    const newBuffer = new ArrayBuffer(newSize);
    const newBytes = new Uint8Array(newBuffer);
    const newView = new DataView(newBuffer);

    newBytes.set(this.bytes);

    this.view = newView;
    this.bytes = newBytes;
  }

  encodeNil(): void {
    this.writeU8(0xc0);
  }

  encodeBoolean(object: boolean): void {
    if (object === false) {
      this.writeU8(0xc2);
    } else {
      this.writeU8(0xc3);
    }
  }

  encodeNumber(object: number): void {
    if (Number.isSafeInteger(object)) {
      if (object >= 0) {
        if (object < 0x80) {
          // positive fixint
          this.writeU8(object);
        } else if (object < 0x100) {
          // uint 8
          this.writeU8(0xcc);
          this.writeU8(object);
        } else if (object < 0x10000) {
          // uint 16
          this.writeU8(0xcd);
          this.writeU16(object);
        } else if (object < 0x100000000) {
          // uint 32
          this.writeU8(0xce);
          this.writeU32(object);
        } else {
          // uint 64
          this.writeU8(0xcf);
          this.writeU64(object);
        }
      } else if (object >= -0x20) {
        // negative fixint
        this.writeU8(0xe0 | (object + 0x20));
      } else if (object >= -0x80) {
        // int 8
        this.writeU8(0xd0);
        this.writeI8(object);
      } else if (object >= -0x8000) {
        // int 16
        this.writeU8(0xd1);
        this.writeI16(object);
      } else if (object >= -0x80000000) {
        // int 32
        this.writeU8(0xd2);
        this.writeI32(object);
      } else {
        // int 64
        this.writeU8(0xd3);
        this.writeI64(object);
      }
    } else {
      // non-integer numbers
      // float 64
      this.writeU8(0xcb);
      this.writeF64(object);
    }
  }

  writeStringHeader(size: number): void {
    if (size < 0x100) {
      // bin 8
      this.writeU8(0xc4);
      this.writeU8(size);
    } else if (size < 0x10000) {
      // bin 16
      this.writeU8(0xc5);
      this.writeU16(size);
    } else {
      // bin 32
      this.writeU8(0xc6);
      this.writeU32(size);
    }
  }

  encodeString(object: string): void {
    const maxHeaderSize = 1 + 4;
    const strLength = object.length;

    if (TEXT_ENCODING_AVAILABLE && strLength > TEXT_ENCODER_THRESHOLD) {
      const byteLength = utf8Count(object);
      this.ensureBufferSizeToWrite(maxHeaderSize + byteLength);
      this.writeStringHeader(byteLength);
      utf8EncodeTE(object, this.bytes, this.pos);
      this.pos += byteLength;
    } else {
      const byteLength = utf8Count(object);
      this.ensureBufferSizeToWrite(maxHeaderSize + byteLength);
      this.writeStringHeader(byteLength);
      utf8EncodeJs(object, this.bytes, this.pos);
      this.pos += byteLength;
    }
  }

  encodeObject(object: unknown, depth: number): void {
    // try to encode objects with custom codec first of non-primitives
    const ext = this.extensionCodec.tryToEncode(object);
    if (ext != null) {
      this.encodeExtension(ext);
    } else if (Array.isArray(object)) {
      if (isJsbi(object)) {
        this.encodeJSBI(object as JSBI);
      } else {
        this.encodeArray(object, depth);
      }
    } else if (ArrayBuffer.isView(object)) {
      this.encodeBinary(object);
    } else if (typeof object === 'bigint') {
      this.encodeBigInt(object as bigint);
    } else if (object instanceof Map) {
      this.encodeMap(object, depth);
    } else if (typeof object === 'object') {
      if (isNeatType(object)) {
        this.encodeNeatClass(object as NeatType);
      } else {
        this.encodePlainObject(object as Record<string, unknown>, depth);
      }
    } else if (typeof object === 'function') {
      this.encodeNil();
    } else {
      // symbol, function and other special object come here unless extensionCodec handles them.
      throw new Error(`Unrecognized object: ${Object.prototype.toString.apply(object)}`);
    }
  }

  encodeNeatClass(value: NeatType): void {
    if (value instanceof Float32) {
      // float 32 -- 0xca
      this.writeU8(0xca);
      this.writeF32(value.value);
    } else if (value instanceof Float64) {
      // float 64 -- 0xcb
      this.writeU8(0xcb);
      this.writeF64(value.value);
    } else if (value instanceof Int) {
      // int
      if (typeof value.value === 'bigint') {
        this.encodeBigInt(value.value);
      } else if (isJsbi(value.value)) {
        this.encodeJSBI(value.value as JSBI);
      } else {
        this.encodeNumber(value.value as number);
      }
    } else if (value instanceof Str) {
      // string
      this.encodeString(value.value);
    } else if (value instanceof Bool) {
      // bool
      this.encodeBoolean(value.value);
    } else {
      // nil
      this.encodeNil();
    }
  }

  encodeBigInt(value: bigint): void {
    // uint 64 -- 0xcf
    // int 64 -- 0xd3
    if (
      value === BigInt(0) ||
      BigInt.asIntN(32, value) > 0 ||
      (value < 0 && BigInt.asUintN(32, value) === value * BigInt(-1))
    ) {
      this.encodeNumber(Number(value));
    } else if (value < 0) {
      this.writeU8(0xd3);
      this.writeI64(value);
    } else {
      this.writeU8(0xcf);
      this.writeU64(value);
    }
  }

  encodeJSBI(value: JSBI): void {
    const strValue = value.toString();
    if (
      strValue === '0' ||
      (JSBI.LE(value, 0x7fffffff) && JSBI.GE(value, -0xffffffff)) ||
      (strValue < '0' && JSBI.GE(value, -0xffffffff))
    ) {
      this.encodeNumber(Number(value));
    } else if (strValue < '0') {
      this.writeU8(0xd3);
      this.writeI64(strValue);
    } else {
      this.writeU8(0xcf);
      this.writeU64(strValue);
    }
  }

  encodeBinary(object: ArrayBufferView): void {
    const size = object.byteLength;
    if (size < 0x100) {
      // bin 8
      this.writeU8(0xc4);
      this.writeU8(size);
    } else if (size < 0x10000) {
      // bin 16
      this.writeU8(0xc5);
      this.writeU16(size);
    } else {
      // bin 32
      this.writeU8(0xc6);
      this.writeU32(size);
    }
    const bytes = ensureUint8Array(object);
    this.writeU8a(bytes);
  }

  encodeArray(object: unknown[], depth: number): void {
    const size = object.length;
    if (size < 16) {
      // fixarray
      this.writeU8(0x90 + size);
    } else if (size < 0x10000) {
      // array 16
      this.writeU8(0xdc);
      this.writeU16(size);
    } else {
      // array 32
      this.writeU8(0xdd);
      this.writeU32(size);
    }
    for (const item of object) {
      this.encode(item, depth + 1);
    }
  }

  encodeMap(object: Map<unknown, unknown>, depth: number): void {
    const size = object.size;
    const sortedMap: [Uint8Array, unknown][] = [];
    if (size < 16) {
      // fixmap
      this.writeU8(0x80 + size);
    } else if (size < 0x10000) {
      // map 16
      this.writeU8(0xde);
      this.writeU16(size);
    } else {
      // map 32
      this.writeU8(0xdf);
      this.writeU32(size);
    }

    object.forEach((value, key): void => {
      const encodedKey: Uint8Array = this.keyEncoder(key, depth + 1);
      sortedMap.push([encodedKey, value]);
    });

    sortedMap.sort(sortMapByKey);

    sortedMap.forEach((keyVal): void => {
      this.writeU8a(keyVal[0]);
      this.encode(keyVal[1], depth + 1);
    });
  }

  encodePlainObject(object: Record<string, unknown>, depth: number): void {
    this.encodeMap(new Map(Object.entries(object)), depth);
  }

  encodeExtension(ext: ExtData): void {
    const size = ext.data.length;
    if (size === 1) {
      // fixext 1
      this.writeU8(0xd4);
    } else if (size === 2) {
      // fixext 2
      this.writeU8(0xd5);
    } else if (size === 4) {
      // fixext 4
      this.writeU8(0xd6);
    } else if (size === 8) {
      // fixext 8
      this.writeU8(0xd7);
    } else if (size === 16) {
      // fixext 16
      this.writeU8(0xd8);
    } else if (size < 0x100) {
      // ext 8
      this.writeU8(0xc7);
      this.writeU8(size);
    } else if (size < 0x10000) {
      // ext 16
      this.writeU8(0xc8);
      this.writeU16(size);
    } else {
      // ext 32
      this.writeU8(0xc9);
      this.writeU32(size);
    }
    this.writeI8(ext.type);
    this.writeU8a(ext.data);
  }

  writeU8(value: number): void {
    this.ensureBufferSizeToWrite(1);

    this.view.setUint8(this.pos, value);
    this.pos++;
  }

  writeU8a(values: ArrayLike<number>): void {
    const size = values.length;
    this.ensureBufferSizeToWrite(size);

    this.bytes.set(values, this.pos);
    this.pos += size;
  }

  writeI8(value: number): void {
    this.ensureBufferSizeToWrite(1);

    this.view.setInt8(this.pos, value);
    this.pos++;
  }

  writeU16(value: number): void {
    this.ensureBufferSizeToWrite(2);

    this.view.setUint16(this.pos, value);
    this.pos += 2;
  }

  writeI16(value: number): void {
    this.ensureBufferSizeToWrite(2);

    this.view.setInt16(this.pos, value);
    this.pos += 2;
  }

  writeU32(value: number): void {
    this.ensureBufferSizeToWrite(4);

    this.view.setUint32(this.pos, value);
    this.pos += 4;
  }

  writeI32(value: number): void {
    this.ensureBufferSizeToWrite(4);

    this.view.setInt32(this.pos, value);
    this.pos += 4;
  }

  writeF32(value: number): void {
    this.ensureBufferSizeToWrite(4);
    this.view.setFloat32(this.pos, value);
    this.pos += 4;
  }

  writeF64(value: number): void {
    this.ensureBufferSizeToWrite(8);
    this.view.setFloat64(this.pos, value);
    this.pos += 8;
  }

  writeU64(value: bigint | string | number): void {
    this.ensureBufferSizeToWrite(8);

    setUint64(this.view, this.pos, value);
    this.pos += 8;
  }

  writeI64(value: bigint | string | number): void {
    this.ensureBufferSizeToWrite(8);

    setInt64(this.view, this.pos, value);
    this.pos += 8;
  }
}
