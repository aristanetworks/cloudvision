import Int64 from 'int64-buffer';
import JSBI from 'jsbi';

import { toString, subarray } from './buffer-util';

function map(decode, decoder, len) {
  const value = {};
  for (let i = 0; i < len; ++i) {
    value[decode(decoder)] = decode(decoder);
  }
  return value;
}

function array(decode, decoder, len) {
  const value = new Array(len);
  for (let i = 0; i < len; ++i) {
    value[i] = decode(decoder);
  }
  return value;
}

function str(decoder, len) {
  const start = decoder.offset;
  decoder.offset = start + len;
  if (decoder.offset > decoder.buffer.byteLength) {
    throw new RangeError('BUFFER_SHORTAGE');
  }
  return toString(decoder.buffer, start, decoder.offset);
}

function bin(decoder, len) {
  const start = decoder.offset;
  decoder.offset = start + len;
  if (decoder.offset > decoder.buffer.byteLength) {
    throw new RangeError('BUFFER_SHORTAGE');
  }
  return subarray(decoder.buffer, start, decoder.offset);
}

function ext(decoder, len) {
  const start = decoder.offset;
  decoder.offset = start + len + 1;
  if (decoder.offset > decoder.buffer.byteLength) {
    throw new RangeError('BUFFER_SHORTAGE');
  }
  const etype = decoder.buffer[start];
  if (decoder.codec) {
    const unpacker = decoder.codec._unpackerFor(etype); // eslint-disable-line no-underscore-dangle
    if (unpacker) {
      return unpacker(subarray(decoder.buffer, start + 1, decoder.offset));
    }
  }
  throw new Error('Unrecognized extension type: ' + (etype ? '0x' + etype.toString(16) : etype));
}

function uint8(decoder) {
  const buffer = decoder.buffer;
  if (decoder.offset >= buffer.byteLength) {
    throw new RangeError('BUFFER_SHORTAGE');
  }
  return buffer[decoder.offset++];
}

function uint16(decoder) {
  const buffer = decoder.buffer;
  if (decoder.offset + 2 > buffer.byteLength) {
    throw new RangeError('BUFFER_SHORTAGE');
  }
  return (buffer[decoder.offset++] << 8) | buffer[decoder.offset++];
}

function uint32(decoder) {
  const buffer = decoder.buffer;
  if (decoder.offset + 4 > buffer.byteLength) {
    throw new RangeError('BUFFER_SHORTAGE');
  }
  return (
    buffer[decoder.offset++] * 0x1000000 +
    ((buffer[decoder.offset++] << 16) | (buffer[decoder.offset++] << 8) | buffer[decoder.offset++])
  );
}

function uint64(decoder) {
  const offset = decoder.offset;
  const buffer = decoder.buffer;
  if (decoder.offset + 8 > buffer.byteLength) {
    throw new RangeError('BUFFER_SHORTAGE');
  }
  decoder.offset += 8;
  if (decoder.useJSBI) {
    const strValue = new Int64.Uint64BE(buffer.buffer, buffer.byteOffset + offset).toString();
    return JSBI.BigInt(strValue);
  }
  return new DataView(buffer.buffer).getBigUint64(buffer.byteOffset + offset);
}

function int8(decoder) {
  const val = uint8(decoder);
  return !(val & 0x80) ? val : (0xff - val + 1) * -1;
}

function int16(decoder) {
  const val = uint16(decoder);
  return val & 0x8000 ? val | 0xffff0000 : val;
}

function int32(decoder) {
  const buffer = decoder.buffer;
  if (decoder.offset + 4 > buffer.byteLength) {
    throw new RangeError('BUFFER_SHORTAGE');
  }
  return (
    (buffer[decoder.offset++] << 24) |
    (buffer[decoder.offset++] << 16) |
    (buffer[decoder.offset++] << 8) |
    buffer[decoder.offset++]
  );
}

function int64(decoder) {
  const offset = decoder.offset;
  const buffer = decoder.buffer;
  if (decoder.offset + 8 > buffer.byteLength) {
    throw new RangeError('BUFFER_SHORTAGE');
  }
  decoder.offset += 8;
  if (decoder.useJSBI) {
    const strValue = new Int64.Int64BE(buffer.buffer, buffer.byteOffset + offset).toString();
    return JSBI.BigInt(strValue);
  }
  return new DataView(buffer.buffer).getBigInt64(buffer.byteOffset + offset);
}

function float32(decoder) {
  const buffer = decoder.buffer;
  const offset = decoder.offset;
  decoder.offset += 4;
  return new DataView(buffer.buffer).getFloat32(buffer.byteOffset + offset);
}

function float64(decoder) {
  const buffer = decoder.buffer;
  const offset = decoder.offset;
  decoder.offset += 8;
  return new DataView(buffer.buffer).getFloat64(buffer.byteOffset + offset);
}

export default {
  map,
  array,
  str,
  bin,
  ext,
  uint8,
  uint16,
  uint32,
  uint64,
  int8,
  int16,
  int32,
  int64,
  float32,
  float64,
};
