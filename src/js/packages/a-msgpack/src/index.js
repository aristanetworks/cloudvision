import { concat, fromString, subarray, toString } from './buffer-util';
import baseCodec from './codec';
import baseDecode from './decode';
import baseEncode from './encode';
import Paper from './paper';
import ReadFormat from './read-format';
import { constant, fix, flex } from './token-creators';
import writeFormat from './write-format';
import writeHeader from './write-header';

const Codec = baseCodec;

function encode(input, codec = new Codec()) {
  if (!(codec instanceof Codec)) {
    throw new TypeError('Expected second argument to be a Codec, if provided.');
  }
  const encoder = new Paper(codec);
  baseEncode(encoder, input);
  return encoder.read();
}

function decode(input, codec = new Codec(), forceJSBI = false) {
  let useJSBI = forceJSBI;
  if (!(codec instanceof Codec)) {
    throw new TypeError('Expected second argument to be a Codec, if provided.');
  }
  if (!(input instanceof Uint8Array)) {
    throw new TypeError('Expected first argument to be a Uint8Array.');
  }
  if (typeof BigInt === 'undefined') {
    useJSBI = true;
  }
  const decoder = new Paper(codec, useJSBI);
  decoder.setBuffer(input);
  return baseDecode(decoder);
}

export const BaseEncoder = Paper;

export const Headers = writeHeader;

export const Encoder = writeFormat;

export const Decoder = ReadFormat;

export const BufferUtils = {
  concat,
  fromString,
  subarray,
  toString,
};

export const TokenCreators = { constant, fix, flex };

export default {
  encode,
  decode,
  Codec,
};
