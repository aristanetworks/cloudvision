/* eslint-env jest */

import { encode, decode, ExtensionCodec } from '../src';

describe('ExtensionCodec', () => {
  describe('custom extensions', () => {
    const extensionCodec = new ExtensionCodec();

    // Set<T>
    extensionCodec.register({
      type: 0,
      encode: (object: unknown): Uint8Array | null => {
        if (object instanceof Set) {
          return encode([...object]);
        }

        return null;
      },
      decode: (data: Uint8Array) => {
        const array = decode(data) as unknown[];
        return new Set(array);
      },
    });

    // Map<T>
    extensionCodec.register({
      type: 1,
      encode: (object: unknown): Uint8Array | null => {
        if (object instanceof Map) {
          return encode([...object]);
        }
        return null;
      },
      decode: (data: Uint8Array) => {
        const array = decode(data) as [unknown, unknown][];
        return new Map(array);
      },
    });

    test('encodes and decodes custom data types (synchronously)', () => {
      const set = new Set([1, 2, 3]);
      const map = new Map([
        ['foo', 'bar'],
        ['bar', 'baz'],
      ]);
      const encoded = encode([set, map], { extensionCodec });
      expect(decode(encoded, { extensionCodec })).toEqual([set, map]);
    });
  });
});
