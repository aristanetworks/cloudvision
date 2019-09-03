/* eslint-env jest */

import msgpack from 'a-msgpack';

import { sortMapByKey } from '../../src/neat/utils';

describe('sortMapByKey', () => {
  test('should return -1, if value a is smaller', () => {
    expect(sortMapByKey([msgpack.encode('a')], [msgpack.encode('b')])).toEqual(-1);
    expect(sortMapByKey([msgpack.encode('a')], [msgpack.encode('aa')])).toEqual(-1);
    expect(sortMapByKey([msgpack.encode(1)], [msgpack.encode(2)])).toEqual(-1);
    expect(sortMapByKey([new Uint8Array([1, 2, 3])], [new Uint8Array([1, 2, 3, 4])])).toEqual(-1);
  });

  test('should return 1, if value a is larger', () => {
    expect(sortMapByKey([msgpack.encode('b')], [msgpack.encode('a')])).toEqual(1);
    expect(sortMapByKey([msgpack.encode('bb')], [msgpack.encode('b')])).toEqual(1);
    expect(sortMapByKey([msgpack.encode(2)], [msgpack.encode(1)])).toEqual(1);
    expect(sortMapByKey([new Uint8Array([1, 2, 3, 4])], [new Uint8Array([1, 2, 3])])).toEqual(1);
  });

  test('should return 0, if values are equal', () => {
    expect(sortMapByKey([msgpack.encode('a')], [msgpack.encode('a')])).toEqual(0);
    expect(sortMapByKey([msgpack.encode(1)], [msgpack.encode(1)])).toEqual(0);
    expect(sortMapByKey([new Uint8Array([1, 2, 3])], [new Uint8Array([1, 2, 3])])).toEqual(0);
    const samePointer = [new Uint8Array([1, 2, 3])];
    expect(sortMapByKey(samePointer, samePointer)).toEqual(0);
  });
});
