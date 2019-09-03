/* eslint-env jest */
/* eslint-disable symbol-description */

import JSBI from 'jsbi';
import { encode as referenceEncode, decode as referenceDecode } from 'msgpack-lite';

import msgpack from '../src';
import Paper from '../src/paper';

const bigIntTestCases = {
  '9223372036854775807': new Uint8Array([207, 127, 255, 255, 255, 255, 255, 255, 255]),
  '-9223372036854775808': new Uint8Array([211, 128, 0, 0, 0, 0, 0, 0, 0]),
  '-2147483648': new Uint8Array([210, 128, 0, 0, 0]),
  '2147483647': new Uint8Array([206, 127, 255, 255, 255]),
  '0': new Uint8Array([0]),
  '32768': new Uint8Array([205, 128, 0]),
};

function expectCorrectLength(value, expectedBytes) {
  const encoded = msgpack.encode(value);
  expect(encoded).toBeInstanceOf(Uint8Array);
  expect(encoded).not.toBeInstanceOf(Buffer);
  if (encoded.byteLength !== expectedBytes) {
    throw new Error(
      '\nExpected ' +
        JSON.stringify(value) +
        ' to encode to ' +
        expectedBytes +
        ' bytes, not ' +
        encoded.byteLength +
        '.',
    );
  }
  return encoded;
}

function expectToEqualReference(value, expectedBytes) {
  const encoded = expectCorrectLength(value, expectedBytes);
  const referenceEncoded = referenceEncode(value);
  if (!Buffer.from(encoded).equals(referenceEncoded)) {
    throw new Error('\nExpected:\n', referenceEncoded, '\nInstead got:\n' + Buffer.from(encoded));
  }
}

function expectToBeUnderstoodByReference(value, expectedBytes) {
  const encoded = expectCorrectLength(value, expectedBytes);
  expect(referenceDecode(Buffer.from(encoded))).toEqual(value);
}

function expectToEqualBigIntTestCases(value, expectedBytes) {
  const encoded = expectCorrectLength(BigInt(value), expectedBytes);
  expect(encoded).toEqual(bigIntTestCases[value]);
}

function expectToEqualJSBITestCases(value, expectedBytes) {
  const encoded = expectCorrectLength(JSBI.BigInt(value), expectedBytes);
  expect(encoded).toEqual(bigIntTestCases[value]);
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

describe('msgpack.encode()', () => {
  test('null', () => {
    expectToEqualReference(null, 1);
  });
  test('undefined', () => {
    expectToEqualReference(undefined, 1);
  });
  test('boolean', () => {
    expectToEqualReference(true, 1);
    expectToEqualReference(false, 1);
  });
  test('fixint', () => {
    expectToEqualReference(0, 1);
    expectToEqualReference(127, 1);
    expectToEqualReference(-1, 1);
    expectToEqualReference(-32, 1);
  });
  test('uint', () => {
    expectToEqualReference(128, 2);
    expectToEqualReference(255, 2);
    expectToEqualReference(256, 3);
    expectToEqualReference(65535, 3);
    expectToEqualReference(65536, 5);
    expectToBeUnderstoodByReference(4294967295, 5);
  });
  test('int', () => {
    expectToEqualReference(-33, 2);
    expectToEqualReference(-128, 2);
    expectToEqualReference(-129, 3);
    expectToEqualReference(-32768, 3);
    expectToEqualReference(-32769, 5);
    expectToEqualReference(-2147483648, 5);
  });
  test('bigint', () => {
    expectToEqualBigIntTestCases('9223372036854775807', 9);
    expectToEqualBigIntTestCases('-9223372036854775808', 9);
    expectToEqualBigIntTestCases(2147483647, 5);
    expectToEqualBigIntTestCases(-2147483648, 5);
    expectToEqualBigIntTestCases(0, 1);
    expectToEqualBigIntTestCases(32768, 3);
  });
  test('jsbi', () => {
    expectToEqualJSBITestCases('9223372036854775807', 9);
    expectToEqualJSBITestCases('-9223372036854775808', 9);
    expectToEqualJSBITestCases(2147483647, 5);
    expectToEqualJSBITestCases(-2147483648, 5);
    expectToEqualJSBITestCases(0, 1);
    expectToEqualJSBITestCases(32768, 3);
  });
  test('float', () => {
    expectToBeUnderstoodByReference(4294967296, 9);
    expectToBeUnderstoodByReference(-2147483904, 9);
    expectToBeUnderstoodByReference(0.5, 9);
    expectToBeUnderstoodByReference(0.25, 9);
    expectToBeUnderstoodByReference(-0.5, 9);
    expectToBeUnderstoodByReference(-0.25, 9);
    expectToBeUnderstoodByReference(4e39, 9);
    expectToBeUnderstoodByReference(-4e39, 9);
    expectToEqualReference(0.3, 9);
    expectToEqualReference(-0.3, 9);
  });
  test('string', () => {
    expectToEqualReference('', 1);
    expectToEqualReference('x', 2);
    expectToEqualReference(stringOf(31), 32);
    expectToEqualReference(stringOf(32), 34);
    expectToEqualReference(stringOf(255), 257);
    expectToEqualReference(stringOf(256), 259);
    expectToEqualReference(stringOf(65535), 65538);
    expectToEqualReference(stringOf(65536), 65541);
  });
  test('binary', () => {
    function expectToEqualReferenceBinary(value, expectedBytes) {
      const encoded = expectCorrectLength(value, expectedBytes);
      const referenceEncoded = referenceEncode(Buffer.from(value));
      if (!Buffer.from(encoded).equals(referenceEncoded)) {
        throw new Error(
          '\nExpected:\n',
          referenceEncoded,
          '\nInstead got:\n' + Buffer.from(encoded),
        );
      }
    }
    function expectToBeUnderstoodByReferenceBinary(value, expectedBytes) {
      const encoded = expectCorrectLength(value, expectedBytes);
      expect(referenceDecode(Buffer.from(encoded))).toEqual(Buffer.from(value));
    }
    expectToEqualReferenceBinary(new Uint8Array(0).fill(0x77), 2);
    expectToEqualReferenceBinary(new Uint8Array(1).fill(0x77), 3);
    expectToEqualReferenceBinary(new Uint8Array(31).fill(0x77), 33);
    expectToEqualReferenceBinary(new Uint8Array(32).fill(0x77), 34);
    expectToBeUnderstoodByReferenceBinary(new Uint8Array(255).fill(0x77), 257);
    expectToEqualReferenceBinary(new Uint8Array(256).fill(0x77), 259);
    expectToEqualReferenceBinary(new Uint8Array(65535).fill(0x77), 65538);
    expectToEqualReferenceBinary(new Uint8Array(65536).fill(0x77), 65541);
  });
  test('array', () => {
    expectToEqualReference(new Array(0).fill(true), 1);
    expectToEqualReference(new Array(1).fill(true), 2);
    expectToEqualReference(new Array(15).fill(true), 16);
    expectToEqualReference(new Array(16).fill(true), 19);
    expectToEqualReference(new Array(255).fill(true), 258);
    expectToEqualReference(new Array(256).fill(true), 259);
    expectToEqualReference(new Array(65535).fill(true), 65538);
    expectToEqualReference(new Array(65536).fill(true), 65541);
  });
  test('object', () => {
    expectToBeUnderstoodByReference({}, 1);
    expectToBeUnderstoodByReference({ '0': true }, 4);
    expectToBeUnderstoodByReference({ '127': true }, 6);
    expectToBeUnderstoodByReference({ '128': true }, 6);
    expectToBeUnderstoodByReference({ '255': true }, 6);
    expectToBeUnderstoodByReference({ '256': true }, 6);
    expectToBeUnderstoodByReference({ '-1': true }, 5);
    expectToBeUnderstoodByReference({ '0.5': true }, 6);
    expectToBeUnderstoodByReference({ '': true }, 3);
    expectToBeUnderstoodByReference({ foo: true }, 6);
    expectToBeUnderstoodByReference({ foo: true }, 6);
    expectToBeUnderstoodByReference(objectOf(15), 1 + 15 * 10);
    expectToBeUnderstoodByReference(objectOf(16), 3 + 16 * 10);
    expectToBeUnderstoodByReference(objectOf(65535), 3 + 65535 * 10);
    expectToBeUnderstoodByReference(objectOf(65536), 5 + 65536 * 10);
  });
  test('symbol', () => {
    if (typeof Symbol === 'function') {
      Buffer.from(msgpack.encode(Symbol())).equals(Buffer.from(msgpack.encode(null)));
    }
  });
  test('function', () => {
    Buffer.from(msgpack.encode(() => {})).equals(Buffer.from(msgpack.encode(null)));
  });
  test('throws error if the second argument is not a Codec', () => {
    expect(() => msgpack.encode('string', 'string codec')).toThrowError(
      'Expected second argument to be a Codec, if provided',
    );
  });
  test('returns `null` if buffer is not defined', () => {
    const encoder = new Paper({});
    expect(encoder.read()).toEqual(null);
  });
  test('reserve', () => {
    const encoder = new Paper({});
    jest.spyOn(encoder, 'flush');
    encoder.setBuffer(new Uint8Array());
    expect(encoder.reserve(1)).toEqual(null);
    expect(encoder.flush).not.toHaveBeenCalled();
  });
});
