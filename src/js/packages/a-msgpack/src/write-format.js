import Int64 from 'int64-buffer';
import JSBI from 'jsbi';

import { fromString } from './buffer-util';
import writeHeader from './write-header';

// Fills the writeType hash with functions that each encode values of their
// respective types at the given Paper's offset.
function int(encoder, value) {
  const uivalue = value >>> 0;
  if (value === uivalue) {
    // positive fixint -- 0x00 - 0x7f
    // uint 8 -- 0xcc
    // uint 16 -- 0xcd
    // uint 32 -- 0xce
    if (uivalue <= 0x7f) {
      writeHeader.type(encoder, uivalue);
    } else if (uivalue <= 0xff) {
      writeHeader.int8(encoder, 0xcc, uivalue);
    } else if (uivalue <= 0xffff) {
      writeHeader.int16(encoder, 0xcd, uivalue);
    } else {
      writeHeader.int32(encoder, 0xce, uivalue);
    }
  } else {
    const ivalue = value | 0;
    // negative fixint -- 0xe0 - 0xff
    // int 8 -- 0xd0
    // int 16 -- 0xd1
    // int 32 -- 0xd2
    if (ivalue >= -0x20) {
      writeHeader.type(encoder, ivalue & 0xff);
    } else if (ivalue >= -0x80) {
      writeHeader.int8(encoder, 0xd0, ivalue);
    } else if (ivalue >= -0x8000) {
      writeHeader.int16(encoder, 0xd1, ivalue);
    } else {
      writeHeader.int32(encoder, 0xd2, ivalue);
    }
  }
}

function number(encoder, value) {
  const uivalue = value >>> 0;
  const ivalue = value | 0;
  if (value === uivalue || value === ivalue) {
    // int
    int(encoder, value);
  } else {
    writeHeader.float64(encoder, value); // float 64 -- 0xcb
  }
}

function string(encoder, value) {
  const utf8 = fromString(value);
  const byteLength = utf8.byteLength;

  // fixstr -- 0xa0 - 0xbf
  // str 8 -- 0xd9
  // str 16 -- 0xda
  // str 32 -- 0xdb
  if (byteLength < 32) {
    writeHeader.type(encoder, 0xa0 + byteLength);
  } else if (byteLength <= 0xff) {
    writeHeader.int8(encoder, 0xd9, byteLength);
  } else if (byteLength <= 0xffff) {
    writeHeader.int16(encoder, 0xda, byteLength);
  } else {
    writeHeader.int32(encoder, 0xdb, byteLength);
  }

  encoder.send(utf8);
}

function boolean(encoder, value) {
  // false -- 0xc2
  // true -- 0xc3
  writeHeader.type(encoder, value ? 0xc3 : 0xc2);
}

function nil(encoder) {
  // nil -- 0xc0
  writeHeader.type(encoder, 0xc0);
}

function bin(encoder, value) {
  const byteLength = value.byteLength;

  // bin 8 -- 0xc4
  // bin 16 -- 0xc5
  // bin 32 -- 0xc6
  if (byteLength <= 0xff) {
    writeHeader.int8(encoder, 0xc4, byteLength);
  } else if (byteLength <= 0xffff) {
    writeHeader.int16(encoder, 0xc5, byteLength);
  } else {
    writeHeader.int32(encoder, 0xc6, byteLength);
  }

  encoder.send(value);
}

function ext(encoder, value) {
  const byteLength = value.buffer.byteLength;

  // fixext 1 -- 0xd4
  // fixext 2 -- 0xd5
  // fixext 4 -- 0xd6
  // fixext 8 -- 0xd7
  // fixext 16 -- 0xd8
  // ext 8 -- 0xc7
  // ext 16 -- 0xc8
  // ext 32 -- 0xc9
  if (byteLength === 1) {
    writeHeader.int8(encoder, 0xd4, value.etype);
  } else if (byteLength === 2) {
    writeHeader.int8(encoder, 0xd5, value.etype);
  } else if (byteLength === 4) {
    writeHeader.int8(encoder, 0xd6, value.etype);
  } else if (byteLength === 8) {
    writeHeader.int8(encoder, 0xd7, value.etype);
  } else if (byteLength === 16) {
    writeHeader.int8(encoder, 0xd8, value.etype);
  } else if (byteLength <= 0xff) {
    writeHeader.int8(encoder, 0xc7, byteLength);
    writeHeader.type(encoder, value.etype);
  } else if (byteLength <= 0xffff) {
    writeHeader.int16(encoder, 0xc8, byteLength);
    writeHeader.type(encoder, value.etype);
  } else {
    writeHeader.int32(encoder, 0xc9, byteLength);
    writeHeader.type(encoder, value.etype);
  }

  encoder.send(value.buffer);
}

function array(encode, encoder, value) {
  const length = value.length;

  // fixarray -- 0x90 - 0x9f
  // array 16 -- 0xdc
  // array 32 -- 0xdd
  if (length < 16) {
    writeHeader.type(encoder, 0x90 + length);
  } else if (length <= 0xffff) {
    writeHeader.int16(encoder, 0xdc, length);
  } else {
    writeHeader.int32(encoder, 0xdd, length);
  }

  for (let i = 0; i < length; ++i) {
    encode(encoder, value[i]);
  }
}

function map(encode, encoder, value) {
  const keys = Object.keys(value);
  const length = keys.length;

  // fixmap -- 0x80 - 0x8f
  // map 16 -- 0xde
  // map 32 -- 0xdf
  if (length < 16) {
    writeHeader.type(encoder, 0x80 + length);
  } else if (length <= 0xffff) {
    writeHeader.int16(encoder, 0xde, length);
  } else {
    writeHeader.int32(encoder, 0xdf, length);
  }

  for (let i = 0; i < length; ++i) {
    const key = keys[i];
    encode(encoder, key);
    encode(encoder, value[key]);
  }
}

function jsBi(encode, encoder, value) {
  // uint 64 -- 0xcf
  // int 64 -- 0xd3
  const strValue = value.toString();
  if (
    strValue === '0' ||
    (JSBI.LE(value, 0x7fffffff) && JSBI.GE(value, -0xffffffff)) ||
    (strValue < '0' && JSBI.GE(value, -0xffffffff))
  ) {
    encode(encoder, parseInt(value, 10));
  } else if (strValue < '0') {
    writeHeader.int64(encoder, 0xd3);
    const arrayValue = new Int64.Int64BE(strValue);
    encoder.send(new Uint8Array(arrayValue.toArray()));
  } else {
    writeHeader.int64(encoder, 0xcf);
    const arrayValue = new Int64.Uint64BE(strValue);
    encoder.send(new Uint8Array(arrayValue.toArray()));
  }
}

function object(encode, writeType, encoder, value) {
  if (value === null) {
    return nil(encoder);
  }
  if (Array.isArray(value)) {
    // int 64 as JSBI.BigInt (JSBI is an array internally)
    if (value instanceof JSBI) {
      return jsBi(encode, encoder, value);
    }
    return array(encode, encoder, value);
  }
  if (value instanceof Uint8Array) {
    return bin(encoder, value);
  }
  if (encoder.codec) {
    const packer = encoder.codec._packerFor(value); // eslint-disable-line no-underscore-dangle
    if (packer) {
      return ext(encoder, packer(value));
    }
  }

  // float 32 -- 0xca
  if (value instanceof Float32Array) {
    return writeHeader.float32(encoder, value.value);
  }

  return writeType.map(encoder, value);
}

function bigint(encode, encoder, value) {
  // uint 64 -- 0xcf
  // int 64 -- 0xd3
  if (
    value === BigInt(0) ||
    BigInt.asIntN(32, value) > 0 ||
    (value < 0 && BigInt.asUintN(32, value) === value * BigInt(-1))
  ) {
    encode(encoder, parseInt(value, 10));
  } else if (value < 0) {
    writeHeader.int64(encoder, 0xd3);
    const arrayValue = new DataView(new ArrayBuffer(8));
    arrayValue.setBigInt64(0, value);
    encoder.send(new Uint8Array(arrayValue.buffer));
  } else {
    writeHeader.int64(encoder, 0xcf);
    const arrayValue = new DataView(new ArrayBuffer(8));
    arrayValue.setBigUint64(0, value);
    encoder.send(new Uint8Array(arrayValue.buffer));
  }
}

export default {
  array,
  bigint,
  bin,
  boolean,
  ext,
  int,
  jsBi,
  map,
  nil,
  number,
  object,
  string,
};
