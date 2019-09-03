/* eslint-env jest */
/* eslint-disable symbol-description */

import JSBI from 'jsbi';
import { decode as referenceDecode } from 'msgpack-lite';

import msgpack from '../src';
import Codec from '../src/codec';
import baseDecode from '../src/decode';
import Paper from '../src/paper';

const bigIntTestCases = {
  '9223372036854775807': BigInt('9223372036854775807'),
  '-9223372036854775808': BigInt('-9223372036854775808'),
  '-2147483648': -2147483648,
  '2147483647': 2147483647,
  '0': 0,
  '32768': 32768,
};

const jsBITestCases = {
  '9223372036854775807': JSBI.BigInt('9223372036854775807'),
  '-9223372036854775808': JSBI.BigInt('-9223372036854775808'),
  '-2147483648': -2147483648,
  '2147483647': 2147483647,
  '0': 0,
  '32768': 32768,
};

function expectToDecodeLikeReference(value) {
  const encoded = msgpack.encode(value);
  expect(msgpack.decode(encoded)).toEqual(referenceDecode(Buffer.from(encoded)));
}

function expectToDecodeExactly(value) {
  const encoded = msgpack.encode(value);
  expect(msgpack.decode(encoded)).toEqual(value);
  expect(msgpack.decode(encoded)).toEqual(referenceDecode(Buffer.from(encoded)));
}

function expectToEqualBigIntTestCases(value) {
  const encoded = msgpack.encode(BigInt(value));
  expect(msgpack.decode(encoded)).toEqual(bigIntTestCases[value]);
}

function expectProperBufferHandling(value, lengthDiff) {
  const codec = new Codec();
  codec.register(
    0x42,
    Date,
    (date) => msgpack.encode(+date),
    (buffer) => new Date(msgpack.decode(buffer)),
  );

  const input = msgpack.encode(value, codec);

  const decoder = new Paper(codec, true);
  decoder.setBuffer(input);
  const originalOffset = decoder.offset;

  baseDecode(decoder);

  expect(decoder.offset - originalOffset - 1).toBe(lengthDiff);

  const decoderNoJSBI = new Paper(codec, false);
  decoderNoJSBI.setBuffer(input);
  const originalNoJSBIOffset = decoderNoJSBI.offset;

  baseDecode(decoderNoJSBI);

  expect(decoder.offset - originalNoJSBIOffset - 1).toBe(lengthDiff);
}

function expectToEqualJSBITestCases(value) {
  const encoded = msgpack.encode(JSBI.BigInt(value));
  expect(msgpack.decode(encoded, undefined, true)).toEqual(jsBITestCases[value]);
}

function stringOf(length) {
  let str = '';
  while (str.length < length) {
    str += 'x';
  }
  return str;
}

function objectOf(keyCount) {
  const obj = {};
  for (let i = 0; i < keyCount; ++i) {
    obj[-1000000 - i] = true;
  }
  return obj;
}

[Array, Uint8Array].forEach((Class) => {
  if (typeof Class.prototype.fill !== 'function') {
    Class.prototype.fill = (value) => {
      for (let i = 0; i < this.length; ++i) {
        this[i] = value;
      }
      return this;
    };
  }
});

describe('msgpack.msgpack.decode()', () => {
  test('null', () => {
    expectToDecodeExactly(null);
  });
  test('undefined', () => {
    expectToDecodeLikeReference(undefined);
  });
  test('boolean', () => {
    expectToDecodeExactly(true);
    expectToDecodeExactly(false);
  });
  test('fixint', () => {
    expectToDecodeExactly(0);
    expectToDecodeExactly(127);
    expectToDecodeExactly(-1);
    expectToDecodeExactly(-32);
  });
  test('uint', () => {
    expectToDecodeExactly(128);
    expectToDecodeExactly(255);
    expectToDecodeExactly(256);
    expectToDecodeExactly(65535);
    expectToDecodeExactly(65536);
    expectToDecodeExactly(4294967295);
  });
  test('int', () => {
    expectToDecodeExactly(-33);
    expectToDecodeExactly(-128);
    expectToDecodeExactly(-129);
    expectToDecodeExactly(-32768);
    expectToDecodeExactly(-32769);
    expectToDecodeExactly(-2147483648);
  });
  test('bigint', () => {
    expectToEqualBigIntTestCases('9223372036854775807');
    expectToEqualBigIntTestCases('-9223372036854775808');
    expectToEqualBigIntTestCases(2147483647);
    expectToEqualBigIntTestCases(-2147483648);
    expectToEqualBigIntTestCases(0);
    expectToEqualBigIntTestCases(32768);
  });
  test('jsbi', () => {
    expectToEqualJSBITestCases('9223372036854775807');
    expectToEqualJSBITestCases('-9223372036854775808');
    expectToEqualJSBITestCases(2147483647);
    expectToEqualJSBITestCases(-2147483648);
    expectToEqualJSBITestCases(0);
    expectToEqualJSBITestCases(32768);
  });
  test('float', () => {
    expectToDecodeExactly(4294967296);
    expectToDecodeExactly(-2147483904);
    expectToDecodeExactly(0.5);
    expectToDecodeExactly(0.25);
    expectToDecodeExactly(-0.5);
    expectToDecodeExactly(-0.25);
    expectToDecodeExactly(4e39);
    expectToDecodeExactly(-4e39);
    expectToDecodeExactly(0.3);
    expectToDecodeExactly(-0.3);
  });
  test('string', () => {
    expectToDecodeExactly('');
    expectToDecodeExactly('x');
    expectToDecodeExactly(stringOf(31));
    expectToDecodeExactly(stringOf(32));
    expectToDecodeExactly(stringOf(255));
    expectToDecodeExactly(stringOf(256));
    expectToDecodeExactly(stringOf(65535));
    expectToDecodeExactly(stringOf(65536));
  });
  test('binary', () => {
    function expectToDecodeExactBinary(value) {
      const encoded = msgpack.encode(value);
      expect(msgpack.decode(encoded)).toEqual(value);
      const decodedBuffer = referenceDecode(Buffer.from(encoded));
      if (!decodedBuffer.equals(Buffer.from(msgpack.decode(encoded)))) {
        throw new Error(
          '\nExpected:\n',
          decodedBuffer,
          '\nInstead got:\n' + Buffer.from(msgpack.decode(encoded)),
        );
      }
    }
    expectToDecodeExactBinary(new Uint8Array(0).fill(0x77));
    expectToDecodeExactBinary(new Uint8Array(1).fill(0x77));
    expectToDecodeExactBinary(new Uint8Array(31).fill(0x77));
    expectToDecodeExactBinary(new Uint8Array(32).fill(0x77));
    expectToDecodeExactBinary(new Uint8Array(255).fill(0x77));
    expectToDecodeExactBinary(new Uint8Array(256).fill(0x77));
    expectToDecodeExactBinary(new Uint8Array(65535).fill(0x77));
    expectToDecodeExactBinary(new Uint8Array(65536).fill(0x77));
  });
  test('array', () => {
    expectToDecodeExactly(new Array(0).fill(true));
    expectToDecodeExactly(new Array(1).fill(true));
    expectToDecodeExactly(new Array(15).fill(true));
    expectToDecodeExactly(new Array(16).fill(true));
    expectToDecodeExactly(new Array(255).fill(true));
    expectToDecodeExactly(new Array(256).fill(true));
    expectToDecodeExactly(new Array(65535).fill(true));
    expectToDecodeExactly(new Array(65536).fill(true));
  });
  test('object', () => {
    expectToDecodeExactly({});
    expectToDecodeExactly({ '0': true });
    expectToDecodeExactly({ '127': true });
    expectToDecodeExactly({ '128': true });
    expectToDecodeExactly({ '255': true });
    expectToDecodeExactly({ '256': true });
    expectToDecodeExactly({ '-1': true });
    expectToDecodeExactly({ '0.5': true });
    expectToDecodeExactly({ '': true });
    expectToDecodeExactly({ foo: true });
    expectToDecodeExactly({ foo: true });
    expectToDecodeExactly(objectOf(15));
    expectToDecodeExactly(objectOf(16));
    expectToDecodeExactly(objectOf(65535));
    expectToDecodeExactly(objectOf(65536));
  });
  test('symbol', () => {
    if (typeof Symbol === 'function') {
      expectToDecodeLikeReference(Symbol());
    }
  });
  test('function', () => {
    expectToDecodeLikeReference(() => {});
  });
  test('throws error if type is invalid', () => {
    const codecWithInvalidToken = new msgpack.Codec();
    codecWithInvalidToken.readToken[255] = undefined;

    expect(() => msgpack.decode(new Uint8Array([255]), codecWithInvalidToken)).toThrowError();
  });
  test('throws error if the second argument is not a Codec', () => {
    expect(() => msgpack.decode(new Uint8Array([255]), 'string codec')).toThrowError(
      'Expected second argument to be a Codec, if provided',
    );
  });
  test('throws error if the first argument is not a Uint8Array', () => {
    expect(() => msgpack.decode('string')).toThrowError(
      'Expected first argument to be a Uint8Array.',
    );
  });
});

describe('throws buffer shortage error', () => {
  function createPaperForBufferShorage(type, maxLen) {
    const decoder = new Paper(new Codec());
    const input = new Uint8Array([type, 68, 111, 100, 103, 101]);
    decoder.setBuffer(input);
    if (maxLen) {
      decoder.offset = maxLen;
    }

    return decoder;
  }

  function shouldThrowShortageErrorForToken(token, maxLen) {
    const decoder = createPaperForBufferShorage(token, maxLen);
    const func = decoder.codec.readToken[token];
    expect(() => func(decoder)).toThrowError('BUFFER_SHORTAGE');
  }

  test('string', () => {
    shouldThrowShortageErrorForToken(0xd9);
    shouldThrowShortageErrorForToken(0xda);
    shouldThrowShortageErrorForToken(0xdb);
  });
  test('bin', () => {
    shouldThrowShortageErrorForToken(0xc4);
  });
  test('uint', () => {
    shouldThrowShortageErrorForToken(0xcc, 6);
    shouldThrowShortageErrorForToken(0xcd, 10);
    shouldThrowShortageErrorForToken(0xce, 12);
    shouldThrowShortageErrorForToken(0xcf, 14);
  });
  test('int', () => {
    shouldThrowShortageErrorForToken(0xd0, 6);
    shouldThrowShortageErrorForToken(0xd1, 10);
    shouldThrowShortageErrorForToken(0xd2, 12);
    shouldThrowShortageErrorForToken(0xd3, 14);
  });
  test('ext', () => {
    shouldThrowShortageErrorForToken(0xc7);
    shouldThrowShortageErrorForToken(0xc8);
    shouldThrowShortageErrorForToken(0xc9);
  });
  test('should throw non unrecognized type error', () => {
    const decoder = createPaperForBufferShorage(1);
    const func = decoder.codec.readToken[0xc7];
    expect(() => func(decoder)).toThrowError('Unrecognized extension type');
  });
});

describe('buffer offset handling', () => {
  test('null', () => {
    expectProperBufferHandling(null, 0);
  });

  test('undefined', () => {
    expectProperBufferHandling(undefined, 0);
  });

  test('boolean', () => {
    expectProperBufferHandling(true, 0);
    expectProperBufferHandling(false, 0);
  });

  test('fixint', () => {
    expectProperBufferHandling(0, 0);
    expectProperBufferHandling(127, 0);
    expectProperBufferHandling(-1, 0);
    expectProperBufferHandling(-32, 0);
  });

  test('int', () => {
    expectProperBufferHandling(-33, 1);
    expectProperBufferHandling(-128, 1);
    expectProperBufferHandling(-129, 2);
    expectProperBufferHandling(-32768, 2);
    expectProperBufferHandling(-32769, 4);
    expectProperBufferHandling(-2147483648, 4);
    expectProperBufferHandling(JSBI.BigInt('-9223372036854775808'), 8);
    expectProperBufferHandling(BigInt('-9223372036854775808'), 8);
  });

  test('uint', () => {
    expectProperBufferHandling(128, 1);
    expectProperBufferHandling(255, 1);
    expectProperBufferHandling(256, 2);
    expectProperBufferHandling(65535, 2);
    expectProperBufferHandling(65536, 4);
    expectProperBufferHandling(4294967295, 4);
    expectProperBufferHandling(JSBI.BigInt('9223372036854775807'), 8);
    expectProperBufferHandling(BigInt('9223372036854775807'), 8);
  });

  test('float', () => {
    expectProperBufferHandling(0.5, 8);
    expectProperBufferHandling(0.25, 8);
    expectProperBufferHandling(-0.5, 8);
    expectProperBufferHandling(-0.25, 8);
    expectProperBufferHandling(4e39, 8);
    expectProperBufferHandling(-4e39, 8);
    expectProperBufferHandling(0.3, 8);
    expectProperBufferHandling(-0.3, 8);
  });

  test('string', () => {
    expectProperBufferHandling('', 0);
    expectProperBufferHandling('x', 1);
    expectProperBufferHandling(stringOf(31), 31);
    expectProperBufferHandling(stringOf(32), 33);
    expectProperBufferHandling(stringOf(255), 256);
    expectProperBufferHandling(stringOf(256), 258);
    expectProperBufferHandling(stringOf(65535), 65537);
    expectProperBufferHandling(stringOf(65536), 65540);
  });

  test('binary', () => {
    expectProperBufferHandling(new Uint8Array(0).fill(0x77), 1);
    expectProperBufferHandling(new Uint8Array(1).fill(0x77), 2);
    expectProperBufferHandling(new Uint8Array(31).fill(0x77), 32);
    expectProperBufferHandling(new Uint8Array(32).fill(0x77), 33);
    expectProperBufferHandling(new Uint8Array(255).fill(0x77), 256);
    expectProperBufferHandling(new Uint8Array(256).fill(0x77), 258);
    expectProperBufferHandling(new Uint8Array(65535).fill(0x77), 65537);
    expectProperBufferHandling(new Uint8Array(65536).fill(0x77), 65540);
  });

  test('ext', () => {
    expectProperBufferHandling(new Date(1555018162982), 11);
    expectProperBufferHandling(new Date(1), 2);
  });
});
