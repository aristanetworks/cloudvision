/* eslint-env jest */

import msgpack from 'a-msgpack';
import { fromByteArray } from 'base64-js';
import fs from 'fs';
import yaml from 'js-yaml';
import JSBI from 'jsbi';

import { Codec, NeatTypes } from '../../src/neat';
import { decodePointer } from '../../src/neat/extensions';
import { createBaseType } from '../../src/neat/typeCreators';

const INT_64_CODE = 207;
const UINT_64_CODE = 211;

const PRIMITIVE_DEFAULTS = {
  boolean: {
    value: new NeatTypes.Bool(),
    binaryValue: [194],
  },
  integer: {
    value: new NeatTypes.Int(),
    binaryValue: [0],
  },
  float32: {
    value: new NeatTypes.Float32(),
    binaryValue: [202, 0, 0, 0, 0],
  },
  float64: {
    value: new NeatTypes.Float64(),
    binaryValue: [203, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  string: {
    value: new NeatTypes.Str(),
    binaryValue: [196, 0],
  },
  array: {
    value: [],
    binaryValue: [144],
  },
  object: {
    value: {},
    binaryValue: [128],
  },
};

function createComplexMap(complexArr) {
  const map = new Map();
  for (let i = 0; i < complexArr.length; i += 2) {
    const keyType = createBaseType(complexArr[i]);
    keyType.forEach((v, k) => {
      if (v instanceof NeatTypes.Int) {
        keyType.set(k, new NeatTypes.Float64(v.value));
      }
    });

    let valueType = createBaseType(complexArr[i + 1]);
    if (valueType instanceof NeatTypes.Int) {
      valueType = new NeatTypes.Float64(valueType.value);
    }

    map.set(keyType, valueType);
  }

  return map;
}

function createComplexKey(key) {
  const mapArr = [];
  Object.entries(key).forEach((entry) => {
    mapArr.push([
      entry[0],
      typeof entry[1] !== 'string' ? new NeatTypes.Float64(entry[1]) : entry[1],
    ]);
  });

  return fromByteArray(msgpack.encode(new Map(mapArr), Codec));
}

function createExpectedComplexObject(complexArr) {
  const obj = {};
  for (let i = 0; i < complexArr.length; i += 2) {
    obj[createComplexKey(complexArr[i])] = {
      _key: complexArr[i],
      _value: complexArr[i + 1],
    };
  }
  return obj;
}

describe('NEAT codec', () => {
  const tests = yaml.safeLoad(fs.readFileSync(process.cwd() + '/test/codec_tests.yaml'));
  const arrayTests = [];
  const boolTests = [];
  const complexTests = [];
  const float32Tests = [];
  const float64Tests = [];
  const int16Tests = [];
  const int32Tests = [];
  const int64Tests = [];
  const int8Tests = [];
  const mapTests = [];
  const pointerTests = [];
  const stringTests = [];
  const nilTests = [];
  const bytesTests = [];

  tests.tests.forEach((test) => {
    if (test.bool !== undefined) {
      boolTests.push(test);
    } else if (test.i8 !== undefined) {
      int8Tests.push(test);
    } else if (test.i16 !== undefined) {
      int16Tests.push(test);
    } else if (test.i32 !== undefined) {
      int32Tests.push(test);
    } else if (test.i64 !== undefined) {
      int64Tests.push(test);
    } else if (test.f32 !== undefined) {
      float32Tests.push(test);
    } else if (test.f64 !== undefined) {
      float64Tests.push(test);
    } else if (test.str !== undefined) {
      stringTests.push(test);
    } else if (test.map !== undefined) {
      mapTests.push(test);
    } else if (test.array !== undefined) {
      arrayTests.push(test);
    } else if (test.pointer !== undefined) {
      pointerTests.push(test);
    } else if (test.complex !== undefined) {
      complexTests.push(test);
    } else if (test.bytes !== undefined) {
      bytesTests.push(test);
    } else {
      nilTests.push(test);
    }
  });

  test('should properly encode/decode nil', () => {
    nilTests.forEach((test) => {
      expect(msgpack.encode(null, Codec)).toEqual(new Uint8Array(test.out));
      expect(msgpack.decode(new Uint8Array(test.out), Codec)).toEqual(null);
      expect(msgpack.encode(undefined, Codec)).toEqual(new Uint8Array(test.out));
      expect(msgpack.decode(new Uint8Array(test.out), Codec)).toEqual(null);

      // Without custom codec
      expect(msgpack.encode(null)).toEqual(new Uint8Array(test.out));
      expect(msgpack.decode(new Uint8Array(test.out))).toEqual(null);
      expect(msgpack.encode(undefined)).toEqual(new Uint8Array(test.out));
      expect(msgpack.decode(new Uint8Array(test.out))).toEqual(null);
    });
  });

  test('should properly encode/decode bytes', () => {
    bytesTests.forEach((test) => {
      expect(msgpack.encode(new Uint8Array(test.bytes), Codec)).toEqual(new Uint8Array(test.out));
      expect(msgpack.decode(new Uint8Array(test.out), Codec)).toEqual('');

      // Without custom codec
      expect(msgpack.encode(new Uint8Array(test.bytes))).toEqual(new Uint8Array(test.out));
      expect(msgpack.decode(new Uint8Array(test.out))).toEqual(new Uint8Array([]));
    });
  });

  test('should properly encode/decode bool', () => {
    boolTests.forEach((test) => {
      expect(msgpack.encode(test.bool, Codec)).toEqual(new Uint8Array(test.out));
      expect(msgpack.decode(new Uint8Array(test.out), Codec)).toEqual(test.bool);

      // Without custom codec
      expect(msgpack.encode(test.bool)).toEqual(new Uint8Array(test.out));
      expect(msgpack.decode(new Uint8Array(test.out))).toEqual(test.bool);
    });
  });

  test('should properly encode/decode int8', () => {
    int8Tests.forEach((test) => {
      const int = new NeatTypes.Int(test.i8);
      expect(msgpack.encode(test.i8, Codec)).toEqual(new Uint8Array(test.out));
      expect(msgpack.decode(new Uint8Array(test.out), Codec)).toEqual(test.i8);
      expect(msgpack.encode(int, Codec)).toEqual(new Uint8Array(test.out));
      expect(msgpack.decode(new Uint8Array(test.out), Codec)).toEqual(int.value);

      // Without custom codec
      expect(msgpack.encode(test.i8)).toEqual(new Uint8Array(test.out));
      expect(msgpack.decode(new Uint8Array(test.out))).toEqual(test.i8);
    });
  });

  test('should properly encode/decode int16', () => {
    int16Tests.forEach((test) => {
      const int = new NeatTypes.Int(test.i16);
      expect(msgpack.encode(test.i16, Codec)).toEqual(new Uint8Array(test.out));
      expect(msgpack.decode(new Uint8Array(test.out), Codec)).toEqual(test.i16);
      expect(msgpack.encode(int, Codec)).toEqual(new Uint8Array(test.out));
      expect(msgpack.decode(new Uint8Array(test.out), Codec)).toEqual(int.value);

      // Without custom codec
      expect(msgpack.encode(test.i16)).toEqual(new Uint8Array(test.out));
      expect(msgpack.decode(new Uint8Array(test.out))).toEqual(test.i16);
    });
  });

  test('should properly encode/decode int32', () => {
    int32Tests.forEach((test) => {
      const int = new NeatTypes.Int(test.i32);
      expect(msgpack.encode(test.i32, Codec)).toEqual(new Uint8Array(test.out));
      expect(msgpack.decode(new Uint8Array(test.out), Codec)).toEqual(test.i32);
      expect(msgpack.encode(int, Codec)).toEqual(new Uint8Array(test.out));
      expect(msgpack.decode(new Uint8Array(test.out), Codec)).toEqual(int.value);

      // Without custom codec
      expect(msgpack.encode(test.i32)).toEqual(new Uint8Array(test.out));
      expect(msgpack.decode(new Uint8Array(test.out))).toEqual(test.i32);
    });
  });

  test('should properly encode/decode int64', () => {
    int64Tests.forEach((test) => {
      const int = new NeatTypes.Int(test.i64);
      expect(msgpack.encode(BigInt(test.i64), Codec)).toEqual(new Uint8Array(test.out));
      expect(msgpack.encode(int, Codec)).toEqual(new Uint8Array(test.out));

      // Without custom codec
      expect(msgpack.encode(BigInt(test.i64))).toEqual(new Uint8Array(test.out));

      if (test.out[0] !== INT_64_CODE && test.out[0] !== UINT_64_CODE) {
        expect(msgpack.decode(new Uint8Array(test.out), Codec)).toEqual(parseInt(test.i64, 10));
        expect(msgpack.decode(new Uint8Array(test.out), Codec)).toEqual(int.value);

        // Without custom codec
        expect(msgpack.decode(new Uint8Array(test.out))).toEqual(parseInt(test.i64, 10));
      } else {
        expect(msgpack.decode(new Uint8Array(test.out), Codec)).toEqual(BigInt(test.i64));
        expect(msgpack.decode(new Uint8Array(test.out), Codec)).toEqual(BigInt(int.value));
        const int64 = new NeatTypes.Int(BigInt(test.i64));
        expect(msgpack.encode(int64, Codec)).toEqual(new Uint8Array(test.out));
        expect(msgpack.decode(new Uint8Array(test.out), Codec)).toEqual(int64.value);

        // Without custom codec
        expect(msgpack.decode(new Uint8Array(test.out))).toEqual(BigInt(test.i64));
      }
    });
  });

  test('should properly encode/decode int64 as JSBI', () => {
    int64Tests.forEach((test) => {
      const int = new NeatTypes.Int(test.i64, true);
      expect(msgpack.encode(JSBI.BigInt(test.i64), Codec)).toEqual(new Uint8Array(test.out));
      expect(msgpack.encode(int, Codec)).toEqual(new Uint8Array(test.out));

      // Without custom codec
      expect(msgpack.encode(JSBI.BigInt(test.i64))).toEqual(new Uint8Array(test.out));

      if (test.out[0] !== INT_64_CODE && test.out[0] !== UINT_64_CODE) {
        expect(msgpack.decode(new Uint8Array(test.out), Codec, true)).toEqual(
          parseInt(test.i64, 10),
        );
        expect(msgpack.decode(new Uint8Array(test.out), Codec, true)).toEqual(int.value);

        // Without custom codec
        expect(msgpack.decode(new Uint8Array(test.out), undefined, true)).toEqual(
          parseInt(test.i64, 10),
        );
      } else {
        expect(msgpack.decode(new Uint8Array(test.out), Codec, true)).toEqual(
          JSBI.BigInt(test.i64),
        );
        expect(msgpack.decode(new Uint8Array(test.out), Codec, true)).toEqual(
          JSBI.BigInt(int.value),
        );
        const int64 = new NeatTypes.Int(JSBI.BigInt(test.i64), true);
        expect(msgpack.encode(int64, Codec)).toEqual(new Uint8Array(test.out));
        expect(msgpack.decode(new Uint8Array(test.out), Codec, true)).toEqual(int64.value);

        // Without custom codec
        expect(msgpack.decode(new Uint8Array(test.out), undefined, true)).toEqual(
          JSBI.BigInt(test.i64),
        );
      }
    });
  });

  test('should properly encode/decode string', () => {
    stringTests.forEach((test) => {
      expect(msgpack.encode(test.str, Codec)).toEqual(new Uint8Array(test.out));
      expect(msgpack.decode(new Uint8Array(test.out), Codec)).toEqual(test.str);
    });
  });

  test('should properly encode/decode array', () => {
    arrayTests.forEach((test) => {
      expect(msgpack.encode(test.array, Codec)).toEqual(new Uint8Array(test.out));
      expect(msgpack.decode(new Uint8Array(test.out), Codec)).toEqual(test.array);
    });
  });

  test('should properly encode/decode simple objects as maps', () => {
    mapTests.forEach((test) => {
      expect(msgpack.encode(test.map, Codec)).toEqual(new Uint8Array(test.out));
      expect(msgpack.decode(new Uint8Array(test.out), Codec)).toEqual(test.map);
    });
  });

  test('should properly encode/decode maps', () => {
    mapTests.forEach((test) => {
      const map = new Map(Object.entries(test.map));
      expect(msgpack.encode(map, Codec)).toEqual(new Uint8Array(test.out));
      expect(msgpack.decode(new Uint8Array(test.out), Codec)).toEqual(test.map);
    });
  });

  test('should add proper header and length for map 32', () => {
    const map = new Map();
    const obj = {};
    const key = 'key';
    const value = 'value';
    for (let i = 0; i < 65537; i += 1) {
      map.set(key + i, value);
      obj[key + i] = value;
    }

    const encodedValue = msgpack.encode(map, Codec);

    expect(encodedValue[0]).toEqual(0xdf);
    expect(encodedValue.slice(1, 5)).toEqual(new Uint8Array([0, 1, 0, 1]));
    expect(msgpack.decode(encodedValue, Codec)).toEqual(obj);
  });

  test('should properly encode/decode pointers', () => {
    pointerTests.forEach((test) => {
      // Empty pointer
      if (!test.pointer.length) {
        expect(msgpack.encode(new NeatTypes.Pointer(), Codec)).toEqual(new Uint8Array(test.out));
        expect(msgpack.decode(new Uint8Array(test.out), Codec)).toEqual(
          new NeatTypes.Pointer(test.pointer),
        );
      }
      expect(msgpack.encode(new NeatTypes.Pointer(test.pointer), Codec)).toEqual(
        new Uint8Array(test.out),
      );
      expect(msgpack.decode(new Uint8Array(test.out), Codec)).toEqual(
        new NeatTypes.Pointer(test.pointer),
      );
    });
  });

  test('should properly encode/decode maps with complex keys', () => {
    complexTests.forEach((test) => {
      expect(msgpack.encode(createComplexMap(test.complex), Codec)).toEqual(
        new Uint8Array(test.out),
      );
      expect(msgpack.decode(new Uint8Array(test.out), Codec)).toEqual(
        createExpectedComplexObject(test.complex),
      );
    });
  });

  test('should properly encode/decode float32', () => {
    float32Tests.forEach((test) => {
      const float = new NeatTypes.Float32(test.f32);
      expect(msgpack.encode(float, Codec)).toEqual(new Uint8Array(test.out));
      expect(msgpack.decode(new Uint8Array(test.out), Codec)).toEqual(Math.fround(test.f32));
    });
  });

  test('should properly encode/decode float64', () => {
    float64Tests.forEach((test) => {
      const float = new NeatTypes.Float64(test.f64);
      expect(msgpack.encode(float, Codec)).toEqual(new Uint8Array(test.out));
      expect(msgpack.decode(new Uint8Array(test.out), Codec)).toEqual(parseFloat(test.f64));
    });
  });

  test('should properly encode/decode functions', () => {
    const randomClass = class RandomNonExistantType {};
    const randomFunction = function randomFunction() {};
    const nullByte = [0xc0];
    expect(msgpack.encode(randomClass, Codec)).toEqual(new Uint8Array(nullByte));
    expect(msgpack.encode(randomFunction, Codec)).toEqual(new Uint8Array(nullByte));
  });

  test('should fallback to an empty pointer, if pointer is not decoded as an array', () => {
    expect(decodePointer(Codec)(new Uint8Array([212, 0, 0]))).toEqual(new NeatTypes.Pointer());
  });

  describe('Encode primitive default values', () => {
    const type = Object.keys(PRIMITIVE_DEFAULTS);
    type.forEach((primitiveType) => {
      test(`should properly encode ${primitiveType}`, () => {
        const primitive = PRIMITIVE_DEFAULTS[primitiveType];
        expect(msgpack.encode(primitive.value, Codec)).toEqual(
          new Uint8Array(primitive.binaryValue),
        );
      });
    });
  });
});
