/* eslint-disable no-console */

import { encode, decode, Pointer, Codec } from '../src';

const pointer = new Pointer([
  'The',
  'Dodgers',
  'are',
  'the',
  'best',
  'baseball',
  'team',
  'and',
  'the',
  'Astros',
  'are',
  'cheater',
]);

const encoded = encode(pointer, { extensionCodec: Codec });

console.log('encoded size:', encoded.byteLength);

console.time('decode pointer');
for (let i = 0; i < 1000; i++) {
  decode(encoded, { extensionCodec: Codec });
}
console.timeEnd('decode pointer');

console.time('encode pointer');
for (let i = 0; i < 1000; i++) {
  encode(pointer, { extensionCodec: Codec });
}
console.timeEnd('encode pointer');
