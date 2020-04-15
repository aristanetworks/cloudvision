/* eslint-env jest */

import { encode, decode } from '../src';

describe('edge cases', () => {
  describe('try to encode cyclic refs', () => {
    test('throws errors on arrays', () => {
      const cyclicRefs: unknown[] = [];
      cyclicRefs.push(cyclicRefs);
      expect(() => {
        encode(cyclicRefs);
      }).toThrow(/too deep/i);
    });

    test('throws errors on objects', () => {
      const cyclicRefs: Record<string, unknown> = {};
      cyclicRefs.foo = cyclicRefs;
      expect(() => {
        encode(cyclicRefs);
      }).toThrow(/too deep/i);
    });
  });

  describe('try to encode non-encodable objects', () => {
    test('throws errors', () => {
      expect(() => {
        encode(Symbol('Astros are cheaters'));
      }).toThrow(/unrecognized object/i);
    });
  });

  describe('try to decode invlid MessagePack binary', () => {
    test('throws errors', () => {
      const TYPE_NEVER_USED = 0xc1;

      expect(() => {
        decode([TYPE_NEVER_USED]);
      }).toThrow(/unrecognized type byte/i);
    });
  });

  describe('try to decode insufficient data', () => {
    test('throws errors (synchronous)', () => {
      expect(() => {
        decode([196, 3, 115, 116]);
      }).toThrow(/Insufficient data/i);
    });
    test('throws errors for extentions (synchronous)', () => {
      expect(() => {
        decode([213, 0, 145]);
      }).toThrow(/Insufficient data/i);
    });
  });

  describe('try to decode data with extra bytes', () => {
    test('throws errors (synchronous)', () => {
      expect(() => {
        decode([
          0x90, // fixarray size=0
          ...encode(null),
        ]);
      }).toThrow(RangeError);
    });
  });

  describe('MAX_SAFE_INTEGER as float64', () => {
    const input = 9007199254740992;
    const out = new Uint8Array([203, 67, 64, 0, 0, 0, 0, 0, 0]);

    test('encode', () => {
      expect(encode(input)).toEqual(out);
    });

    test('decode', () => {
      expect(decode(out)).toEqual(input);
    });
  });

  test('decode without cachedKeyDecoder', () => {
    const input = { a: 'b', c: 'd' };
    const out = new Uint8Array([130, 196, 1, 97, 196, 1, 98, 196, 1, 99, 196, 1, 100]);

    expect(
      decode(out, {
        cachedKeyDecoder: null,
      }),
    ).toEqual(input);
  });
});
