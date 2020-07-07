/* eslint-env jest */
/* eslint-disable @typescript-eslint/naming-convention */

import { encode } from '../../src';
import { Bool, Float32, Float64, Int, Nil, Pointer, Str } from '../../src/neat/NeatTypes';
import { isNeatType, NeatTypeSerializer, sortMapByKey } from '../../src/neat/utils';

function testSerializeAndDeserialize(
  value: Bool | Float32 | Float64 | Nil | Int | Str | Pointer,
): void {
  const serializedValue = NeatTypeSerializer.serialize(value);
  const deserializedValue = NeatTypeSerializer.deserialize(serializedValue);
  expect(serializedValue.value).toEqual(value.value);
  /* eslint-disable-next-line */
  expect(serializedValue.__neatTypeClass).toEqual(value.type);
  expect(deserializedValue.value).toEqual(value.value);
  expect(deserializedValue.type).toEqual(value.type);
}

describe('isNeatType', () => {
  test('should validate proper Neat objects', () => {
    const exampleStr = new Str('arista');
    const exampleNil = new Nil();
    const exampleBool = new Bool(true);
    const exampleInt = new Int(7);
    const exampleFloat32 = new Float32(91.3);
    const exampleFloat64 = new Float64(90000.25);
    const examplePtr = new Pointer(['path', 'to', 'fivepm']);

    expect(isNeatType(exampleStr)).toBeTruthy();
    expect(isNeatType(exampleNil)).toBeTruthy();
    expect(isNeatType(exampleBool)).toBeTruthy();
    expect(isNeatType(exampleInt)).toBeTruthy();
    expect(isNeatType(exampleFloat32)).toBeTruthy();
    expect(isNeatType(exampleFloat64)).toBeTruthy();
    expect(isNeatType(examplePtr)).toBeTruthy();
  });
  test('should reject regular javascript elements', () => {
    expect(isNeatType('arista')).toBeFalsy();
    expect(isNeatType(null)).toBeFalsy();
    expect(isNeatType(true)).toBeFalsy();
    expect(isNeatType(7)).toBeFalsy();
    expect(isNeatType(91.3)).toBeFalsy();
    expect(isNeatType(90000.25)).toBeFalsy();
    expect(isNeatType(['path', 'to', 'fivepm'])).toBeFalsy();
    expect(isNeatType({ type: 'device', value: 'red_herring' })).toBeFalsy();
    expect(isNeatType({ type: 'str', value: 'nefarious', valueTwo: 'fake neattype' })).toBeFalsy();
    const fakePtr = { type: 'ptr', value: ['ptr', 'w/o', 'delimiter', 'is', 'just', 'array'] };
    expect(isNeatType(fakePtr)).toBeFalsy();
  });
});

describe('sortMapByKey', () => {
  test('should return -1, if value a is smaller', () => {
    expect(sortMapByKey([encode('a'), 'a'], [encode('b'), 'b'])).toEqual(-1);
    expect(sortMapByKey([encode('a'), 'a'], [encode('aa'), 'aa'])).toEqual(-1);
    expect(sortMapByKey([encode(1), 1], [encode(2), 2])).toEqual(-1);
    expect(
      sortMapByKey(
        [new Uint8Array([1, 2, 3]), [1, 2, 3]],
        [new Uint8Array([1, 2, 3, 4]), [1, 2, 3, 4]],
      ),
    ).toEqual(-1);
  });

  test('should return 1, if value a is larger', () => {
    expect(sortMapByKey([encode('b'), 'b'], [encode('a'), 'a'])).toEqual(1);
    expect(sortMapByKey([encode('bb'), 'bb'], [encode('b'), 'b'])).toEqual(1);
    expect(sortMapByKey([encode(2), 2], [encode(1), 1])).toEqual(1);
    expect(
      sortMapByKey(
        [new Uint8Array([1, 2, 3, 4]), [1, 2, 3, 4]],
        [new Uint8Array([1, 2, 3]), [1, 2, 3]],
      ),
    ).toEqual(1);
  });

  test('should return 0, if values are equal', () => {
    expect(sortMapByKey([encode('a'), 'a'], [encode('a'), 'a'])).toEqual(0);
    expect(sortMapByKey([encode(1), 1], [encode(1), 1])).toEqual(0);
    expect(
      sortMapByKey([new Uint8Array([1, 2, 3]), [1, 2, 3]], [new Uint8Array([1, 2, 3]), [1, 2, 3]]),
    ).toEqual(0);
    const samePointer: [Uint8Array, unknown] = [new Uint8Array([1, 2, 3]), [1, 2, 3]];
    expect(sortMapByKey(samePointer, samePointer)).toEqual(0);
  });
});

describe('NeatTypeSerializer', () => {
  test('Bool', () => {
    testSerializeAndDeserialize(new Bool(true));
    testSerializeAndDeserialize(new Bool(false));
  });
  test('Float32', () => {
    testSerializeAndDeserialize(new Float32(123.456));
  });
  test('Float64', () => {
    testSerializeAndDeserialize(new Float64(8274.51123));
  });
  test('Int', () => {
    testSerializeAndDeserialize(new Int(67));
  });
  test('Str', () => {
    testSerializeAndDeserialize(new Str('the answer is now'));
  });
  test('Pointer', () => {
    testSerializeAndDeserialize(new Pointer(['path', 'to', 'glory']));
  });
  test('Nil', () => {
    testSerializeAndDeserialize(new Nil());
  });
});
