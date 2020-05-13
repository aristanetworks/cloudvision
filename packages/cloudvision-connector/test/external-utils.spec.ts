/* eslint-env jest */

import { Pointer } from 'a-msgpack';

import { fromBinaryKey, toBinaryKey } from '../src/utils';

const binaryKeyTestCases = [
  {
    encodedValue: 'xAtEYXRhc2V0SW5mbw==',
    decodedValue: 'DatasetInfo',
  },
  {
    encodedValue: 'gsQETmFtZcQSZnJvbnRUb0JhY2tBaXJmbG93xAVWYWx1ZQE=',
    decodedValue: { Name: 'frontToBackAirflow', Value: 1 },
  },
  {
    encodedValue: 'xzQAlcQFU3lzZGLEC2Vudmlyb25tZW50xAp0aGVybW9zdGF0xAZzdGF0dXPECWZhbkNvbmZpZw==',
    decodedValue: new Pointer(['Sysdb', 'environment', 'thermostat', 'status', 'fanConfig']),
  },
  {
    encodedValue: 'Kg==',
    decodedValue: 42,
  },
  {
    encodedValue: 'y0BFJmZmZmZm',
    decodedValue: 42.3,
  },
  {
    encodedValue: 'lAEKCAs=',
    decodedValue: [1, 10, 8, 11],
  },
  {
    encodedValue: 'ww==',
    decodedValue: true,
  },
  {
    encodedValue: 'wg==',
    decodedValue: false,
  },
];

describe('toBinaryKey', () => {
  test('should create the proper binary key given any key', () => {
    binaryKeyTestCases.forEach((testCase) => {
      expect(toBinaryKey(testCase.decodedValue)).toBe(testCase.encodedValue);
    });
  });
});

describe('fromBinaryKey', () => {
  test('should create the proper binary key given any key', () => {
    binaryKeyTestCases.forEach((testCase) => {
      expect(fromBinaryKey(testCase.encodedValue)).toEqual(testCase.decodedValue);
    });
  });
});
