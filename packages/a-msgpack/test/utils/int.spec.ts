/* eslint-env jest */

import JSBI from 'jsbi';

import { setInt64, getInt64, getUint64, setUint64 } from '../../src/utils/int';

describe('codec: int64 / uint64', () => {
  describe.each([
    ['ZERO', 0],
    ['ONE', 1],
    ['MINUS_ONE', -1],
    ['X_FF', 0xff],
    ['MINUS_X_FF', -0xff],
    ['INT32_MAX', 0x7fffffff],
    ['INT32_MIN', -0x7fffffff - 1],
    ['MAX_SAFE_INTEGER', Number.MAX_SAFE_INTEGER],
    ['MIN_SAFE_INTEGER', Number.MIN_SAFE_INTEGER],
    ['MAX_SAFE_INTEGER as String', Number.MAX_SAFE_INTEGER.toString()],
    ['MIN_SAFE_INTEGER as String', Number.MIN_SAFE_INTEGER.toString()],
    ['positive int64 as BigInt', BigInt(Number.MAX_SAFE_INTEGER + 1)],
    ['positive int64 as Number', Number.MAX_SAFE_INTEGER + 1],
    ['positive int64 as String', (Number.MAX_SAFE_INTEGER + 1).toString()],
    ['negative int64 as BigInt', BigInt(Number.MIN_SAFE_INTEGER - 1)],
    ['negative int64 as Number', Number.MIN_SAFE_INTEGER - 1],
    ['negative int64 as String', (Number.MIN_SAFE_INTEGER - 1).toString()],
  ])('int 64', (name, value) => {
    test(`sets and gets ${name} ${value}`, () => {
      const b = new Uint8Array(8);
      const view = new DataView(b.buffer);
      setInt64(view, 0, value);
      expect(getInt64(view, 0, false)).toEqual(BigInt(value));
    });

    test(`sets and gets ${name} ${value} as JSBI when forced`, () => {
      const b = new Uint8Array(8);
      const view = new DataView(b.buffer);
      setInt64(view, 0, value);
      const result = typeof value === 'bigint' ? value.toString() : value;
      expect(getInt64(view, 0, true)).toEqual(JSBI.BigInt(result));
    });

    test(`sets and gets ${name} ${value} as JSBI when BigInt not available`, () => {
      const b = new Uint8Array(8);
      const view = new DataView(b.buffer);
      // @ts-ignore This is for testing DataViews that do not implement int64
      view.getBigInt64 = undefined;
      setInt64(view, 0, value);
      const result = typeof value === 'bigint' ? value.toString() : value;
      expect(getInt64(view, 0, false)).toEqual(JSBI.BigInt(result));
    });
  });

  describe.each([
    ['ZERO', 0],
    ['ONE', 1],
    ['X_FF', 0xff],
    ['INT32_MAX', 0x7fffffff],
    ['MAX_SAFE_INTEGER', Number.MAX_SAFE_INTEGER],
    ['positive int64 as BigInt', BigInt(Number.MAX_SAFE_INTEGER + 1)],
    ['positive int64 as Number', Number.MAX_SAFE_INTEGER + 1],
    ['positive int64 as String', (Number.MAX_SAFE_INTEGER + 1).toString()],
  ])('uint 64', (name, value) => {
    test(`sets and gets ${name} ${value}`, () => {
      const b = new Uint8Array(8);
      const view = new DataView(b.buffer);
      setUint64(view, 0, value);
      expect(getUint64(view, 0, false)).toEqual(BigInt(value));
    });

    test(`sets and gets ${name} ${value} as JSBI when forced`, () => {
      const b = new Uint8Array(8);
      const view = new DataView(b.buffer);
      setUint64(view, 0, value);
      const result = typeof value === 'bigint' ? value.toString() : value;
      expect(getUint64(view, 0, true)).toEqual(JSBI.BigInt(result));
    });

    test(`sets and gets ${name} ${value} as JSBI when BigInt not available`, () => {
      const b = new Uint8Array(8);
      const view = new DataView(b.buffer);
      // @ts-ignore This is for testing DataViews that do not implement int64
      view.getBigUint64 = undefined;
      setUint64(view, 0, value);
      const result = typeof value === 'bigint' ? value.toString() : value;
      expect(getUint64(view, 0, false)).toEqual(JSBI.BigInt(result));
    });
  });

  describe.each([
    ['NaN', NaN],
    ['NaN as String', 'NaN'],
    ['UNDEFINED', undefined],
    ['UNDEFINED as String', 'undefined'],
  ])('edge cases', (name, value) => {
    test(`int64 sets and gets ${name} ${value}`, () => {
      const b = new Uint8Array(8);
      const view = new DataView(b.buffer);
      // @ts-ignore So that we can test undefined
      setInt64(view, 0, value);
      expect(getInt64(view, 0, false)).toEqual(BigInt(0));
    });

    test(`uint64 sets and gets ${name} ${value}`, () => {
      const b = new Uint8Array(8);
      const view = new DataView(b.buffer);
      // @ts-ignore So that we can test undefined
      setUint64(view, 0, value);
      expect(getUint64(view, 0, false)).toEqual(BigInt(0));
    });
  });
});
