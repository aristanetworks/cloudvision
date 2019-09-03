import readFormat from './read-format';

const readUint8 = readFormat.uint8;

export default function decode(decoder) {
  const type = readUint8(decoder);
  const func = decoder.codec.readToken[type];
  if (!func) {
    throw new Error('Invalid type: 0x' + type.toString(16));
  }
  return func(decoder);
}
