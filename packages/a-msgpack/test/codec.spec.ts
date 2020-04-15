/* eslint-env jest */

import { fromByteArray } from 'base64-js';
import fs from 'fs';
import yaml from 'js-yaml';
import JSBI from 'jsbi';

import { encode, decode } from '../src';
import { Codec, NeatTypes } from '../src/neat';
import { decodePointer } from '../src/neat/extensions';
import { createBaseType } from '../src/neat/typeCreators';
import { PlainObject } from '../types';
import { BaseType, Element } from '../types/neat';

const INT_64_CODE = 207;
const UINT_64_CODE = 211;

const msgpackCustomCodec = {
  encode: (inputs: unknown) => encode(inputs, { extensionCodec: Codec }),
  decode: (data: Uint8Array) => decode(data, { extensionCodec: Codec }),
};
const msgpackCustomCodecJSBI = {
  encode: (inputs: unknown) => encode(inputs, { extensionCodec: Codec }),
  decode: (data: Uint8Array) => decode(data, { extensionCodec: Codec, useJSBI: true }),
};
const msgpackJSBI = {
  encode: (inputs: unknown) => encode(inputs),
  decode: (data: Uint8Array) => decode(data, { useJSBI: true }),
};

const PRIMITIVE_DEFAULTS: {
  [key: string]: { value: unknown; binaryValue: number[] };
} = {
  boolean: {
    value: new NeatTypes.Bool(false),
    binaryValue: [194],
  },
  integer: {
    value: new NeatTypes.Int(0),
    binaryValue: [0],
  },
  float32: {
    value: new NeatTypes.Float32(0),
    binaryValue: [202, 0, 0, 0, 0],
  },
  float64: {
    value: new NeatTypes.Float64(0),
    binaryValue: [203, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  string: {
    value: new NeatTypes.Str(''),
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

interface YamlTest {
  name: string;
  out: number[];
  bool: boolean;
  i8: number;
  i16: number;
  i32: number;
  i64: string;
  f32: number;
  f64: string;
  str: string;
  map: object;
  array: unknown[];
  pointer: Element[];
  complex: [object, unknown][];
  bytes: number[];
}

function createComplexMap(complexArr: unknown[]) {
  const map = new Map();
  for (let i = 0; i < complexArr.length; i += 2) {
    const keyType = createBaseType(complexArr[i]) as Map<unknown, BaseType>;
    keyType.forEach((v: BaseType, k: unknown) => {
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

function createComplexKey(key: object): string {
  const mapArr: [unknown, unknown][] = [];
  Object.entries(key).forEach((entry) => {
    mapArr.push([
      entry[0],
      typeof entry[1] !== 'string' ? new NeatTypes.Float64(entry[1]) : entry[1],
    ]);
  });

  return fromByteArray(msgpackCustomCodec.encode(new Map(mapArr)));
}

function createExpectedComplexObject(complexArr: unknown[]) {
  const obj: PlainObject<unknown> = {};
  for (let i = 0; i < complexArr.length; i += 2) {
    const key = complexArr[i] as object;
    obj[createComplexKey(key)] = {
      _key: key,
      _value: complexArr[i + 1],
    };
  }
  return obj;
}

describe('NEAT codec', () => {
  const tests = yaml.safeLoad(fs.readFileSync(process.cwd() + '/test/codec_tests.yaml', 'utf8'));
  const arrayTests: YamlTest[] = [];
  const boolTests: YamlTest[] = [];
  const complexTests: YamlTest[] = [];
  const float32Tests: YamlTest[] = [];
  const float64Tests: YamlTest[] = [];
  const int16Tests: YamlTest[] = [];
  const int32Tests: YamlTest[] = [];
  const int64Tests: YamlTest[] = [];
  const int8Tests: YamlTest[] = [];
  const mapTests: YamlTest[] = [];
  const pointerTests: YamlTest[] = [];
  const stringTests: YamlTest[] = [];
  const nilTests: YamlTest[] = [];
  const bytesTests: YamlTest[] = [];

  tests.tests.forEach((test: YamlTest) => {
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
      expect(msgpackCustomCodec.encode(null)).toEqual(new Uint8Array(test.out));
      expect(msgpackCustomCodec.decode(new Uint8Array(test.out))).toEqual(null);
      expect(msgpackCustomCodec.encode(undefined)).toEqual(new Uint8Array(test.out));
      expect(msgpackCustomCodec.decode(new Uint8Array(test.out))).toEqual(null);
    });
  });

  test('should properly encode/decode bytes', () => {
    bytesTests.forEach((test) => {
      expect(msgpackCustomCodec.encode(new Uint8Array(test.bytes))).toEqual(
        new Uint8Array(test.out),
      );
      expect(msgpackCustomCodec.decode(new Uint8Array(test.out))).toEqual('');
    });
  });

  test('should properly encode/decode bool', () => {
    boolTests.forEach((test) => {
      expect(msgpackCustomCodec.encode(test.bool)).toEqual(new Uint8Array(test.out));
      expect(msgpackCustomCodec.decode(new Uint8Array(test.out))).toEqual(test.bool);
    });
  });

  test('should properly encode/decode int8', () => {
    int8Tests.forEach((test) => {
      const int = new NeatTypes.Int(test.i8);
      // expect(msgpackCustomCodec.encode(test.i8)).toEqual(new Uint8Array(test.out));
      // expect(msgpackCustomCodec.decode(new Uint8Array(test.out))).toEqual(test.i8);
      expect(msgpackCustomCodec.encode(int)).toEqual(new Uint8Array(test.out));
      expect(msgpackCustomCodec.decode(new Uint8Array(test.out))).toEqual(int.value);
    });
  });

  test('should properly encode/decode int16', () => {
    int16Tests.forEach((test) => {
      const int = new NeatTypes.Int(test.i16);
      expect(msgpackCustomCodec.encode(test.i16)).toEqual(new Uint8Array(test.out));
      expect(msgpackCustomCodec.decode(new Uint8Array(test.out))).toEqual(test.i16);
      expect(msgpackCustomCodec.encode(int)).toEqual(new Uint8Array(test.out));
      expect(msgpackCustomCodec.decode(new Uint8Array(test.out))).toEqual(int.value);
    });
  });

  test('should properly encode/decode int32', () => {
    int32Tests.forEach((test) => {
      const int = new NeatTypes.Int(test.i32);
      expect(msgpackCustomCodec.encode(test.i32)).toEqual(new Uint8Array(test.out));
      expect(msgpackCustomCodec.decode(new Uint8Array(test.out))).toEqual(test.i32);
      expect(msgpackCustomCodec.encode(int)).toEqual(new Uint8Array(test.out));
      expect(msgpackCustomCodec.decode(new Uint8Array(test.out))).toEqual(int.value);
    });
  });

  test('should properly encode/decode int64', () => {
    int64Tests.forEach((test) => {
      const int = new NeatTypes.Int(test.i64);
      expect(msgpackCustomCodec.encode(BigInt(test.i64))).toEqual(new Uint8Array(test.out));
      expect(msgpackCustomCodec.encode(int)).toEqual(new Uint8Array(test.out));

      if (test.out[0] !== INT_64_CODE && test.out[0] !== UINT_64_CODE) {
        expect(msgpackCustomCodec.decode(new Uint8Array(test.out))).toEqual(parseInt(test.i64, 10));
        expect(msgpackCustomCodec.decode(new Uint8Array(test.out))).toEqual(int.value);
      } else {
        expect(msgpackCustomCodec.decode(new Uint8Array(test.out))).toEqual(BigInt(test.i64));
        expect(msgpackCustomCodec.decode(new Uint8Array(test.out))).toEqual(BigInt(int.value));
        const int64 = new NeatTypes.Int(BigInt(test.i64));
        expect(msgpackCustomCodec.encode(int64)).toEqual(new Uint8Array(test.out));
        expect(msgpackCustomCodec.decode(new Uint8Array(test.out))).toEqual(int64.value);
      }
    });
  });

  test('should properly encode/decode int64 as JSBI', () => {
    int64Tests.forEach((test) => {
      const int = new NeatTypes.Int(test.i64, true);
      expect(msgpackCustomCodecJSBI.encode(JSBI.BigInt(test.i64))).toEqual(
        new Uint8Array(test.out),
      );
      expect(msgpackCustomCodecJSBI.encode(int)).toEqual(new Uint8Array(test.out));

      if (test.out[0] !== INT_64_CODE && test.out[0] !== UINT_64_CODE) {
        expect(msgpackCustomCodecJSBI.decode(new Uint8Array(test.out))).toEqual(
          parseInt(test.i64, 10),
        );
        expect(msgpackCustomCodecJSBI.decode(new Uint8Array(test.out))).toEqual(int.value);

        // Without custom codec
        expect(msgpackJSBI.decode(new Uint8Array(test.out))).toEqual(parseInt(test.i64, 10));
      } else {
        expect(msgpackCustomCodecJSBI.decode(new Uint8Array(test.out))).toEqual(
          JSBI.BigInt(test.i64),
        );
        expect(msgpackCustomCodecJSBI.decode(new Uint8Array(test.out))).toEqual(
          JSBI.BigInt(int.value.toString()),
        );
        const int64 = new NeatTypes.Int(JSBI.BigInt(test.i64));
        expect(msgpackCustomCodecJSBI.encode(int64)).toEqual(new Uint8Array(test.out));
        expect(msgpackCustomCodecJSBI.decode(new Uint8Array(test.out))).toEqual(int64.value);

        // Without custom codec
        expect(msgpackJSBI.decode(new Uint8Array(test.out))).toEqual(JSBI.BigInt(test.i64));
      }
    });
  });

  test('should properly encode/decode string', () => {
    stringTests.forEach((test) => {
      expect(msgpackCustomCodec.encode(test.str)).toEqual(new Uint8Array(test.out));
      expect(msgpackCustomCodec.decode(new Uint8Array(test.out))).toEqual(test.str);
    });
  });

  test('should properly encode/decode array', () => {
    arrayTests.forEach((test) => {
      expect(msgpackCustomCodec.encode(test.array)).toEqual(new Uint8Array(test.out));
      expect(msgpackCustomCodec.decode(new Uint8Array(test.out))).toEqual(test.array);
    });
  });

  test('should properly encode/decode simple objects as maps', () => {
    mapTests.forEach((test) => {
      expect(msgpackCustomCodec.encode(test.map)).toEqual(new Uint8Array(test.out));
      expect(msgpackCustomCodec.decode(new Uint8Array(test.out))).toEqual(test.map);
    });
  });

  test('should properly encode/decode maps', () => {
    mapTests.forEach((test) => {
      const map = new Map(Object.entries(test.map));
      expect(msgpackCustomCodec.encode(map)).toEqual(new Uint8Array(test.out));
      expect(msgpackCustomCodec.decode(new Uint8Array(test.out))).toEqual(test.map);
    });
  });

  test('should add proper header and length for map 32', () => {
    const map = new Map();
    const obj: { [key: string]: string } = {};
    const key = 'key';
    const value = 'value';
    for (let i = 0; i < 65537; i += 1) {
      map.set(key + i, value);
      obj[key + i] = value;
    }

    const encodedValue = msgpackCustomCodec.encode(map);

    expect(encodedValue[0]).toEqual(0xdf);
    expect(encodedValue.slice(1, 5)).toEqual(new Uint8Array([0, 1, 0, 1]));
    expect(msgpackCustomCodec.decode(encodedValue)).toEqual(obj);
  });

  test('should properly encode/decode ext 32', () => {
    const resultPrefix = [201, 0, 1, 0, 3, 0, 145, 197, 255, 255];
    const valueArray = new Array(65536);
    const decodedValue = new NeatTypes.Pointer(valueArray.join('a'));
    const binaryValue = new Array(65535);
    binaryValue.fill(97, 0, 65535);
    const encodedValue = new Uint8Array(resultPrefix.concat(binaryValue));

    expect(msgpackCustomCodec.encode(decodedValue)).toEqual(encodedValue);
    expect(msgpackCustomCodec.decode(encodedValue)).toEqual(decodedValue);
  });

  test('should properly encode/decode array 32', () => {
    const resultPrefix = [221, 0, 1, 0, 0];
    const decodedValue = new Array(65536);
    decodedValue.fill(4, 0, 65536);
    const binaryValue = new Array(65536);
    binaryValue.fill(4, 0, 65536);
    const encodedValue = new Uint8Array(resultPrefix.concat(binaryValue));
    expect(msgpackCustomCodec.encode(decodedValue)).toEqual(encodedValue);
    expect(msgpackCustomCodec.decode(encodedValue)).toEqual(decodedValue);
  });

  test('should properly encode/decode str 32', () => {
    const resultPrefix = [198, 0, 1, 0, 0];
    const valueArray = new Array(65537);
    const decodedValue = valueArray.join('a');
    const binaryValue = new Array(65536);
    binaryValue.fill(97, 0, 65536);
    const encodedValue = new Uint8Array(resultPrefix.concat(binaryValue));
    expect(msgpackCustomCodec.encode(decodedValue)).toEqual(encodedValue);
    expect(msgpackCustomCodec.decode(encodedValue)).toEqual(decodedValue);
  });

  test('should properly encode/decode bin 16', () => {
    const resultPrefix = [197, 16, 0];
    const valueArray = new Array(4097);
    const decodedValue = valueArray.join('a');
    const binaryValue = new Array(4096);
    binaryValue.fill(97, 0, 4096);
    const encodedValue = new Uint8Array(resultPrefix.concat(binaryValue));
    expect(msgpackCustomCodec.encode(new Uint8Array(binaryValue))).toEqual(encodedValue);
    expect(msgpackCustomCodec.decode(encodedValue)).toEqual(decodedValue);
  });

  test('should properly encode/decode bin 32', () => {
    const resultPrefix = [198, 0, 1, 0, 0];
    const valueArray = new Array(65537);
    const decodedValue = valueArray.join('a');
    const binaryValue = new Array(65536);
    binaryValue.fill(97, 0, 65536);
    const encodedValue = new Uint8Array(resultPrefix.concat(binaryValue));
    expect(msgpackCustomCodec.encode(new Uint8Array(binaryValue))).toEqual(encodedValue);
    expect(msgpackCustomCodec.decode(encodedValue)).toEqual(decodedValue);
  });

  test('should properly encode/decode pointers', () => {
    pointerTests.forEach((test) => {
      // Empty pointer
      if (!test.pointer.length) {
        expect(msgpackCustomCodec.encode(new NeatTypes.Pointer())).toEqual(
          new Uint8Array(test.out),
        );
        expect(msgpackCustomCodec.decode(new Uint8Array(test.out))).toEqual(
          new NeatTypes.Pointer(test.pointer),
        );
      }
      expect(msgpackCustomCodec.encode(new NeatTypes.Pointer(test.pointer))).toEqual(
        new Uint8Array(test.out),
      );
      expect(msgpackCustomCodec.decode(new Uint8Array(test.out))).toEqual(
        new NeatTypes.Pointer(test.pointer),
      );
    });
  });

  test('should properly encode/decode maps with complex keys', () => {
    complexTests.forEach((test) => {
      expect(msgpackCustomCodec.encode(createComplexMap(test.complex))).toEqual(
        new Uint8Array(test.out),
      );
      expect(msgpackCustomCodec.decode(new Uint8Array(test.out))).toEqual(
        createExpectedComplexObject(test.complex),
      );
    });
  });

  test('should properly encode/decode map with complex key and undefined object value', () => {
    const testInput = [{ a: 'b', c: 'd' }, Object.create(null)];
    const testDecodedInput = [{ a: 'b', c: 'd' }, null];
    const testOutput = [129, 130, 196, 1, 97, 196, 1, 98, 196, 1, 99, 196, 1, 100, 192];
    expect(msgpackCustomCodec.encode(createComplexMap(testInput))).toEqual(
      new Uint8Array(testOutput),
    );
    expect(msgpackCustomCodec.decode(new Uint8Array(testOutput))).toEqual(
      createExpectedComplexObject(testDecodedInput),
    );
  });

  test('should properly encode/decode float32', () => {
    float32Tests.forEach((test) => {
      const float = new NeatTypes.Float32(test.f32);
      expect(msgpackCustomCodec.encode(float)).toEqual(new Uint8Array(test.out));
      expect(msgpackCustomCodec.decode(new Uint8Array(test.out))).toEqual(Math.fround(test.f32));
    });
  });

  test('should properly encode/decode float64', () => {
    float64Tests.forEach((test) => {
      const float = new NeatTypes.Float64(test.f64);
      expect(msgpackCustomCodec.encode(float)).toEqual(new Uint8Array(test.out));
      expect(msgpackCustomCodec.decode(new Uint8Array(test.out))).toEqual(parseFloat(test.f64));
    });
  });

  test('should properly encode/decode functions', () => {
    const randomClass = class RandomNonExistantType {};
    const randomFunction = () => null;
    const nullByte = [0xc0];
    expect(msgpackCustomCodec.encode(randomClass)).toEqual(new Uint8Array(nullByte));
    expect(msgpackCustomCodec.encode(randomFunction)).toEqual(new Uint8Array(nullByte));
  });

  test('should fallback to an empty pointer, if pointer is not decoded as an array', () => {
    expect(decodePointer(Codec)(new Uint8Array([212, 0, 0]))).toEqual(new NeatTypes.Pointer());
  });

  describe('Encode primitive default values', () => {
    const type = Object.keys(PRIMITIVE_DEFAULTS);
    type.forEach((primitiveType) => {
      test(`should properly encode ${primitiveType}`, () => {
        const primitive = PRIMITIVE_DEFAULTS[primitiveType];
        expect(msgpackCustomCodec.encode(primitive.value)).toEqual(
          new Uint8Array(primitive.binaryValue),
        );
      });
    });
  });
});
