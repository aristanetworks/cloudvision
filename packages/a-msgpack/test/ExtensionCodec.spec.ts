/* eslint-env jest */

import { encode, decode, ExtensionCodec } from '../src';

describe('ExtensionCodec', () => {
  describe('custom extensions', () => {
    const extensionCodec = new ExtensionCodec();

    // Set<T>
    extensionCodec.register({
      type: 0,
      identifier: (data) => data instanceof Set,
      encode: (object: Set<unknown>): Uint8Array => {
        return encode([...object]);
      },
      decode: (data: Uint8Array) => {
        const array = decode(data) as unknown[];
        return new Set(array);
      },
    });

    // DateTime
    extensionCodec.register({
      type: 1,
      identifier: (data) => data instanceof Date,
      encode: (object: Date): Uint8Array => {
        return encode(object.getTime());
      },
      decode: (data: Uint8Array) => {
        const d = decode(data);
        return new Date(Number(d));
      },
    });

    test('encodes and decodes custom data types (synchronously)', () => {
      const set = new Set([1, 2, 3]);
      const date = new Date();
      const encoded = encode([set, date], { extensionCodec });
      expect(decode(encoded, { extensionCodec })).toEqual([set, date]);
    });
  });
});
