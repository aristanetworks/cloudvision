/* eslint-disable no-labels, no-extra-label */

import { fromByteArray } from 'base64-js';
import JSBI from 'jsbi';

import { CachedKeyDecoder } from './CachedKeyDecoder';
import { ExtensionCodec, ExtensionCodecType } from './ExtensionCodec';
import { getInt64, getUint64 } from './utils/int';
import { prettyByte } from './utils/prettyByte';
import { createDataView, ensureUint8Array } from './utils/typedArrays';
import {
  utf8DecodeJs,
  TEXT_ENCODING_AVAILABLE,
  TEXT_DECODER_THRESHOLD,
  utf8DecodeTD,
} from './utils/utf8';

const enum State {
  ARRAY,
  MAP_KEY,
  MAP_VALUE,
}

type MapKeyType = unknown;

const isValidMapKeyType = (key: unknown): key is MapKeyType => {
  const keyType = typeof key;

  return keyType === 'string';
};

type StackMapState = {
  type: State.MAP_KEY | State.MAP_VALUE;
  size: number;
  key: MapKeyType | null;
  keyStart: number;
  keyEnd: number;
  serializedKey: string | null;
  readCount: number;
  map: Record<string, unknown>;
};

type StackArrayState = {
  type: State.ARRAY;
  size: number;
  keyStart: number;
  array: unknown[];
  position: number;
};

type StackState = StackArrayState | StackMapState;

const EMPTY_VIEW = new DataView(new ArrayBuffer(0));
const EMPTY_BYTES = new Uint8Array(EMPTY_VIEW.buffer);

const DEFAULT_MAX_LENGTH = 0xffff_ffff; // uint32_max

const sharedCachedKeyDecoder = new CachedKeyDecoder();

export class Decoder {
  totalPos = 0;

  pos = 0;

  view = EMPTY_VIEW;

  bytes = EMPTY_BYTES;

  readonly stack: StackState[] = [];

  readonly maxStrLength: number;

  readonly maxBinLength: number;

  readonly maxArrayLength: number;

  readonly maxMapLength: number;

  readonly maxExtLength: number;

  readonly extensionCodec: ExtensionCodecType;

  readonly cachedKeyDecoder: CachedKeyDecoder | null;

  readonly useJSBI: boolean;

  constructor(
    extensionCodec = ExtensionCodec.defaultCodec,
    useJSBI = false,
    maxStrLength = DEFAULT_MAX_LENGTH,
    maxBinLength = DEFAULT_MAX_LENGTH,
    maxArrayLength = DEFAULT_MAX_LENGTH,
    maxMapLength = DEFAULT_MAX_LENGTH,
    maxExtLength = DEFAULT_MAX_LENGTH,
    cachedKeyDecoder: CachedKeyDecoder | null = sharedCachedKeyDecoder,
  ) {
    this.extensionCodec = extensionCodec;
    this.cachedKeyDecoder = cachedKeyDecoder;
    this.useJSBI = useJSBI;
    this.maxStrLength = maxStrLength;
    this.maxBinLength = maxBinLength;
    this.maxArrayLength = maxArrayLength;
    this.maxMapLength = maxMapLength;
    this.maxExtLength = maxExtLength;
  }

  setBuffer(buffer: ArrayLike<number> | ArrayBuffer): void {
    this.bytes = ensureUint8Array(buffer);
    this.view = createDataView(this.bytes);
    this.pos = 0;
  }

  hasRemaining(size = 1): boolean {
    return this.view.byteLength - this.pos >= size;
  }

  createNoExtraBytesError(posToShow: number): Error {
    const { view, pos } = this;
    return new RangeError(`Extra ${view.byteLength - pos} byte(s) found at buffer[${posToShow}]`);
  }

  decodeSingleSync(): unknown {
    const object = this.decodeSync();
    if (this.hasRemaining()) {
      throw this.createNoExtraBytesError(this.pos);
    }
    return object;
  }

  decodeSync(): unknown {
    // eslint-disable-next-line no-constant-condition
    DECODE: while (true) {
      const headByte = this.readU8();
      let object: unknown;

      if (headByte >= 0xe0) {
        // negative fixint (111x xxxx) 0xe0 - 0xff
        object = headByte - 0x100;
      } else if (headByte < 0xc0) {
        if (headByte < 0x80) {
          // positive fixint (0xxx xxxx) 0x00 - 0x7f
          object = headByte;
        } else if (headByte < 0x90) {
          // fixmap (1000 xxxx) 0x80 - 0x8f
          const size = headByte - 0x80;
          if (size !== 0) {
            this.pushMapState(size);
            continue DECODE;
          } else {
            object = {};
          }
        } else {
          // fixarray (1001 xxxx) 0x90 - 0x9f
          const size = headByte - 0x90;
          if (size !== 0) {
            this.pushArrayState(size);
            continue DECODE;
          } else {
            object = [];
          }
        }
      } else if (headByte === 0xc0) {
        // nil
        object = null;
      } else if (headByte === 0xc2) {
        // false
        object = false;
      } else if (headByte === 0xc3) {
        // true
        object = true;
      } else if (headByte === 0xca) {
        // float 32
        object = this.readF32();
      } else if (headByte === 0xcb) {
        // float 64
        object = this.readF64();
      } else if (headByte === 0xcc) {
        // uint 8
        object = this.readU8();
      } else if (headByte === 0xcd) {
        // uint 16
        object = this.readU16();
      } else if (headByte === 0xce) {
        // uint 32
        object = this.readU32();
      } else if (headByte === 0xcf) {
        // uint 64
        object = this.readU64();
      } else if (headByte === 0xd0) {
        // int 8
        object = this.readI8();
      } else if (headByte === 0xd1) {
        // int 16
        object = this.readI16();
      } else if (headByte === 0xd2) {
        // int 32
        object = this.readI32();
      } else if (headByte === 0xd3) {
        // int 64
        object = this.readI64();
      } else if (headByte === 0xdc) {
        // array 16
        const size = this.readU16();
        this.pushArrayState(size);
        continue DECODE;
      } else if (headByte === 0xdd) {
        // array 32
        const size = this.readU32();
        this.pushArrayState(size);
        continue DECODE;
      } else if (headByte === 0xde) {
        // map 16
        const size = this.readU16();
        this.pushMapState(size);
        continue DECODE;
      } else if (headByte === 0xdf) {
        // map 32
        const size = this.readU32();
        this.pushMapState(size);
        continue DECODE;
      } else if (headByte === 0xc4) {
        // bin 8
        const size = this.lookU8();
        object = this.decodeUtf8String(size, 1);
      } else if (headByte === 0xc5) {
        // bin 16
        const size = this.lookU16();
        object = this.decodeUtf8String(size, 2);
      } else if (headByte === 0xc6) {
        // bin 32
        const size = this.lookU32();
        object = this.decodeUtf8String(size, 4);
      } else if (headByte === 0xd4) {
        // fixext 1
        object = this.decodeExtension(1, 0);
      } else if (headByte === 0xd5) {
        // fixext 2
        object = this.decodeExtension(2, 0);
      } else if (headByte === 0xd6) {
        // fixext 4
        object = this.decodeExtension(4, 0);
      } else if (headByte === 0xd7) {
        // fixext 8
        object = this.decodeExtension(8, 0);
      } else if (headByte === 0xd8) {
        // fixext 16
        object = this.decodeExtension(16, 0);
      } else if (headByte === 0xc7) {
        // ext 8
        const size = this.lookU8();
        object = this.decodeExtension(size, 1);
      } else if (headByte === 0xc8) {
        // ext 16
        const size = this.lookU16();
        object = this.decodeExtension(size, 2);
      } else if (headByte === 0xc9) {
        // ext 32
        const size = this.lookU32();
        object = this.decodeExtension(size, 4);
      } else {
        throw new Error(`Unrecognized type byte: ${prettyByte(headByte)}`);
      }

      const stack = this.stack;
      while (stack.length > 0) {
        // arrays and maps
        const state = stack[stack.length - 1];
        if (state.type === State.ARRAY) {
          state.array[state.position] = object;
          state.position++;
          if (state.position === state.size) {
            stack.pop();
            object = state.array;
          } else {
            continue DECODE;
          }
        } else if (state.type === State.MAP_KEY) {
          // Map key
          state.keyEnd = this.pos;
          state.key = object;
          state.type = State.MAP_VALUE;
          continue DECODE;
        } else {
          // Map value
          if (!isValidMapKeyType(state.key)) {
            const serializedKey = fromByteArray(this.bytes.slice(state.keyStart, state.keyEnd));
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            state.map[serializedKey!] = { _key: state.key, _value: object };
          } else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            state.map[state.key! as string] = object;
          }
          state.readCount++;

          if (state.readCount === state.size) {
            // This is the last value, end of map
            stack.pop();
            object = state.map;
          } else {
            state.key = null;
            state.type = State.MAP_KEY;
            stack[stack.length - 1].keyStart = this.pos;
            continue DECODE;
          }
        }
      }

      return object;
    }
  }

  pushMapState(size: number): void {
    if (size > this.maxMapLength) {
      throw new Error(
        `Max length exceeded: map length (${size}) > maxMapLengthLength (${this.maxMapLength})`,
      );
    }

    this.stack.push({
      type: State.MAP_KEY,
      size,
      keyStart: this.pos,
      keyEnd: this.pos,
      key: null,
      serializedKey: null,
      readCount: 0,
      map: {},
    });
  }

  pushArrayState(size: number): void {
    if (size > this.maxArrayLength) {
      throw new Error(
        `Max length exceeded: array length (${size}) > maxArrayLength (${this.maxArrayLength})`,
      );
    }

    this.stack.push({
      type: State.ARRAY,
      size,
      keyStart: 1,
      array: new Array<unknown>(size),
      position: 0,
    });
  }

  decodeUtf8String(byteLength: number, headerOffset: number): string {
    if (byteLength > this.maxStrLength) {
      throw new Error(
        'Max length exceeded: ' +
          `UTF-8 byte length (${byteLength}) > maxStrLength (${this.maxStrLength})`,
      );
    }

    if (this.bytes.byteLength < this.pos + headerOffset + byteLength) {
      throw new RangeError('Insufficient data');
    }

    const offset = this.pos + headerOffset;
    let object: string;
    if (this.stateIsMapKey() && this.cachedKeyDecoder?.canBeCached(byteLength)) {
      object = this.cachedKeyDecoder.decode(this.bytes, offset, byteLength);
    } else if (TEXT_ENCODING_AVAILABLE && byteLength > TEXT_DECODER_THRESHOLD) {
      object = utf8DecodeTD(this.bytes, offset, byteLength);
    } else {
      object = utf8DecodeJs(this.bytes, offset, byteLength);
    }
    this.pos += headerOffset + byteLength;
    return object;
  }

  stateIsMapKey(): boolean {
    if (this.stack.length > 0) {
      const state = this.stack[this.stack.length - 1];
      return state.type === State.MAP_KEY;
    }
    return false;
  }

  decodeBinary(byteLength: number, headOffset: number): Uint8Array {
    if (byteLength > this.maxBinLength) {
      throw new Error(
        `Max length exceeded: bin length (${byteLength}) > maxBinLength (${this.maxBinLength})`,
      );
    }

    if (!this.hasRemaining(byteLength + headOffset)) {
      throw new RangeError('Insufficient data');
    }

    const offset = this.pos + headOffset;
    const object = this.bytes.subarray(offset, offset + byteLength);
    this.pos += headOffset + byteLength;
    return object;
  }

  decodeExtension(size: number, headOffset: number): unknown {
    if (size > this.maxExtLength) {
      throw new Error(
        `Max length exceeded: ext length (${size}) > maxExtLength (${this.maxExtLength})`,
      );
    }

    const extType = this.view.getInt8(this.pos + headOffset);
    const data = this.decodeBinary(size, headOffset + 1 /* extType */);
    return this.extensionCodec.decode(data, extType);
  }

  lookU8(): number {
    return this.view.getUint8(this.pos);
  }

  lookU16(): number {
    return this.view.getUint16(this.pos);
  }

  lookU32(): number {
    return this.view.getUint32(this.pos);
  }

  readU8(): number {
    const value = this.view.getUint8(this.pos);
    this.pos++;
    return value;
  }

  readI8(): number {
    const value = this.view.getInt8(this.pos);
    this.pos++;
    return value;
  }

  readU16(): number {
    const value = this.view.getUint16(this.pos);
    this.pos += 2;
    return value;
  }

  readI16(): number {
    const value = this.view.getInt16(this.pos);
    this.pos += 2;
    return value;
  }

  readU32(): number {
    const value = this.view.getUint32(this.pos);
    this.pos += 4;
    return value;
  }

  readI32(): number {
    const value = this.view.getInt32(this.pos);
    this.pos += 4;
    return value;
  }

  readU64(): bigint | JSBI {
    const value = getUint64(this.view, this.pos, this.useJSBI);
    this.pos += 8;
    return value;
  }

  readI64(): bigint | JSBI {
    const value = getInt64(this.view, this.pos, this.useJSBI);
    this.pos += 8;
    return value;
  }

  readF32(): number {
    const value = this.view.getFloat32(this.pos);
    this.pos += 4;
    return value;
  }

  readF64(): number {
    const value = this.view.getFloat64(this.pos);
    this.pos += 8;
    return value;
  }
}
