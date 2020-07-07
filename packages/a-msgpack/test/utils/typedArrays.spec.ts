/* eslint-env jest */

import { ensureUint8Array, createDataView } from '../../src/utils/typedArrays';

describe.each([
  [ensureUint8Array, [1, 2], Uint8Array],
  [ensureUint8Array, new Uint8Array(2), Uint8Array],
  [ensureUint8Array, new ArrayBuffer(2), Uint8Array],
  [ensureUint8Array, new Int8Array(), Uint8Array],
  [createDataView, new ArrayBuffer(2), DataView],
  [createDataView, new Int8Array(), DataView],
])('typedArrays', (fn, input, type) => {
  test(`should return the type ${type.name} for ${fn.name}`, () => {
    // @ts-ignore Easier than typing everything
    expect(fn.call(undefined, input)).toBeInstanceOf(type);
  });
});
