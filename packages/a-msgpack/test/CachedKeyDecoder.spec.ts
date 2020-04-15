/* eslint-env jest */

import { CachedKeyDecoder } from '../src/CachedKeyDecoder';
import { utf8EncodeJs, utf8Count } from '../src/utils/utf8';

function tryDecode(decoder: CachedKeyDecoder, str: string): string {
  const byteLength = utf8Count(str);
  const bytes = new Uint8Array(byteLength);
  utf8EncodeJs(str, bytes, 0);
  if (!decoder.canBeCached(byteLength)) {
    throw new Error('Unexpected precondition');
  }
  return decoder.decode(bytes, 0, byteLength);
}

describe('CachedKeyDecoder', () => {
  describe('basic behavior', () => {
    test('decodes a string', () => {
      const decoder = new CachedKeyDecoder();

      expect(tryDecode(decoder, 'foo')).toEqual('foo');
      expect(tryDecode(decoder, 'foo')).toEqual('foo');
      expect(tryDecode(decoder, 'foo')).toEqual('foo');
    });

    test('decodes strings', () => {
      const decoder = new CachedKeyDecoder();

      expect(tryDecode(decoder, 'foo')).toEqual('foo');
      expect(tryDecode(decoder, 'bar')).toEqual('bar');
      expect(tryDecode(decoder, 'foo')).toEqual('foo');
    });

    test('decodes strings with purging records', () => {
      const decoder = new CachedKeyDecoder(16, 4);

      for (let i = 0; i < 100; i++) {
        expect(tryDecode(decoder, 'foo1')).toEqual('foo1');
        expect(tryDecode(decoder, 'foo2')).toEqual('foo2');
        expect(tryDecode(decoder, 'foo3')).toEqual('foo3');
        expect(tryDecode(decoder, 'foo4')).toEqual('foo4');
        expect(tryDecode(decoder, 'foo5')).toEqual('foo5');
      }
    });
  });

  describe('edge cases', () => {
    // len=0 is not supported because it is just an empty string
    test('decodes str with len=1', () => {
      const decoder = new CachedKeyDecoder();

      expect(tryDecode(decoder, 'f')).toEqual('f');
      expect(tryDecode(decoder, 'a')).toEqual('a');
      expect(tryDecode(decoder, 'f')).toEqual('f');
      expect(tryDecode(decoder, 'a')).toEqual('a');
    });

    test('decodes str with len=maxKeyLength', () => {
      const decoder = new CachedKeyDecoder(1);

      expect(tryDecode(decoder, 'f')).toEqual('f');
      expect(tryDecode(decoder, 'a')).toEqual('a');
      expect(tryDecode(decoder, 'f')).toEqual('f');
      expect(tryDecode(decoder, 'a')).toEqual('a');
    });
  });
});
