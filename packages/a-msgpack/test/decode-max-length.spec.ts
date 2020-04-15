import { encode, decode } from '../src';
// import { Decoder } from '../src/Decoder';
import { ExtensionCodec } from '../src/ExtensionCodec';
import { DecodeOptions } from '../src/decode';
import { POINTER_TYPE } from '../src/neat';
import { Pointer } from '../src/neat/NeatTypes';
import { decodePointer, encodePointer } from '../src/neat/extensions';

const Codec = new ExtensionCodec();

Codec.register({
  type: POINTER_TYPE,
  encode: encodePointer(Codec),
  decode: decodePointer(Codec),
});

describe.each([
  ['maxStrLength', 'foo'],
  ['maxBinLength', new Pointer(['Dodgers'])],
  ['maxArrayLength', [1, 2, 3]],
  ['maxMapLength', { foo: 1, bar: 1, baz: 3 }],
  ['maxExtLength', new Pointer(['Dodgers'])],
])('decode with maxLength specified', (optionName, value) => {
  const input = encode(value, { extensionCodec: Codec });
  const options: DecodeOptions = { [optionName]: 1, extensionCodec: Codec };

  test(`throws errors for ${optionName} (synchronous)`, () => {
    expect(() => {
      decode(input, options);
    }).toThrow(/max length exceeded/i);
  });
});
