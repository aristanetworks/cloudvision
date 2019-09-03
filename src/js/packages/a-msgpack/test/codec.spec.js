/* eslint-env jest */
/* eslint-disable no-use-before-define */

import msgpack, { BufferUtils, Decoder, Encoder, Headers, TokenCreators } from '../src';

const codec = new msgpack.Codec();
codec
  .register(
    0x42,
    Date,
    (date) => msgpack.encode(+date),
    (buffer) => new Date(msgpack.decode(buffer)),
  )
  .register(
    0x43,
    Error,
    (error) => msgpack.encode(error.message),
    (buffer) => new Error(msgpack.decode(buffer)),
  )
  .register(
    0x44,
    AggregateError,
    (aggErrors) => msgpack.encode(aggErrors.errors, codec),
    (buffer) => new AggregateError(msgpack.decode(buffer, codec)),
  );

function AggregateError(errors) {
  this.errors = errors;
}

describe('msgpack.Codec', () => {
  test('Date', () => {
    const date = new Date();
    new Uint8Array(0xfffff).fill(0x77); // take up time
    const date2 = msgpack.decode(msgpack.encode(date, codec), codec);
    expect(date2).toBeInstanceOf(Date);
    expect(+date).toBe(+date2);
  });
  test('Error', () => {
    const err = new Error('foobar');
    const err2 = msgpack.decode(msgpack.encode(err, codec), codec);
    expect(err2).toBeInstanceOf(Error);
    expect(err.message).toBe(err2.message);
  });
  test('AggregateError', () => {
    const errs = [new Error('foo'), new Error('bar'), new Error('baz')];
    const errs2 = msgpack.decode(msgpack.encode(errs, codec), codec);
    expect(errs2).toBeInstanceOf(Array);
    expect(errs.length).toBe(errs2.length);
    expect(errs2[0]).toBeInstanceOf(Error);
    expect(errs2[1]).toBeInstanceOf(Error);
    expect(errs2[2]).toBeInstanceOf(Error);
    expect('3' in errs2).toBe(false);
  });
});

describe('msgpack.Codec errors', () => {
  test('throws error if not constructed properly', () => {
    expect(() => msgpack.Codec()).toThrowError(
      'Codecs must be constructed with the "new" keyword.',
    );
  });
  test('throws error if invalid extension type is passed', () => {
    expect(() => codec.register(0x81, Date, (date) => msgpack.encode(+date))).toThrowError(
      'Invalid extension type (must be between 0 and 127).',
    );
  });
  test('throws error if invalid second argument', () => {
    expect(() => codec.register(0x42, 'Date')).toThrowError(
      'Expected second argument to be a constructor function.',
    );
  });
  test('throws error extension encoder does not return a Uint8Array', () => {
    expect(() => {
      const c = new msgpack.Codec();
      c.register(0x42, Date, () => 'Not Uint8Array');
      const date = new Date();
      msgpack.encode(date, c);
    }).toThrowError('Codec must return a Uint8Array (encoding "Date").');
  });
});

describe('msgpack.Codec array of packers', () => {
  class Telephone {
    constructor(v) {
      this.secret = v;
    }
  }
  const arrayCodec = new msgpack.Codec();
  const packers = [
    (s) => {
      s.secret = s.secret + ', new message'; // eslint-disable-line operator-assignment
      return s.secret;
    },
    (s) => msgpack.encode(s),
  ];
  const unpackers = [
    (s) => new Telephone(msgpack.decode(s)),
    (s) => s.secret + ', I added something too',
  ];
  arrayCodec.register(0x42, Telephone, packers, unpackers);

  test('should encode/decode the Telephone message', () => {
    const encodedMessage = msgpack.encode(new Telephone('original message'), arrayCodec);
    expect(msgpack.decode(encodedMessage, arrayCodec)).toEqual(
      'original message, new message, I added something too',
    );
  });
});

describe('msgpack.Codec override internal tokens and write types', () => {
  const secret = 'secret string';
  const binaryString = 'hello bin';
  const customObject = { foo: 'bar' };
  const customCodec = new msgpack.Codec();
  const encodeString = (encoder, value) => {
    Encoder.bin(encoder, BufferUtils.fromString(value));
  };
  const encodeMap = (encode, encoder) => {
    Headers.type(encoder, 0x81);
    encode(encoder, secret);
  };
  const decodeMap = (decode, decoder, value) => {
    return decode(decoder, value);
  };

  customCodec.replaceWriteType('map', encodeMap, true);
  customCodec.replaceWriteType('string', encodeString);
  customCodec.replaceReadToken(0xc4, TokenCreators.flex, Decoder.uint8, Decoder.str);
  customCodec.replaceReadToken(0xc5, TokenCreators.flex, Decoder.uint16, Decoder.str);
  customCodec.replaceReadToken(0xc6, TokenCreators.flex, Decoder.uint32, Decoder.str);
  customCodec.replaceReadToken(0x81, TokenCreators.fix, 1, decodeMap, true);

  test('should encode with the new write type', () => {
    const textEncoder = new TextEncoder();
    const encodedString = msgpack.encode(binaryString, customCodec);

    expect(encodedString[0]).toEqual(0xc4);
    expect(encodedString.slice(2)).toEqual(textEncoder.encode(binaryString));
  });

  test('should encode with the new write type that is a complex type', () => {
    const textEncoder = new TextEncoder();
    const encodedObject = msgpack.encode(customObject, customCodec);

    expect(encodedObject[0]).toEqual(0x81);
    expect(encodedObject[1]).toEqual(0xc4);
    expect(encodedObject.slice(3)).toEqual(textEncoder.encode(secret));
  });

  test('should decode string as binary', () => {
    expect(msgpack.decode(msgpack.encode(binaryString, customCodec), customCodec)).toEqual(
      binaryString,
    );
  });

  test('should decode custom complex object', () => {
    expect(msgpack.decode(msgpack.encode(customObject, customCodec), customCodec)).toEqual(secret);
  });
});
