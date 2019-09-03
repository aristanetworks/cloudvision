import readFormat from './read-format';
import { constant, fix, flex } from './token-creators';

// Fills the readToken array with functions that each return their decoded
// interpretation of the bytes at the given Paper's offset.
export function generateDefaultReadToken(decode) {
  const readToken = new Array(256);
  const curriedMap = (...m) => readFormat.map(decode, ...m);
  const curriedArray = (...m) => readFormat.array(decode, ...m);

  let i;
  // positive fixint -- 0x00 - 0x7f
  for (i = 0x00; i <= 0x7f; ++i) {
    readToken[i] = constant(i);
  }

  // fixstr -- 0xa0 - 0xbf
  for (i = 0xa0; i <= 0xbf; ++i) {
    readToken[i] = fix(i - 0xa0, readFormat.str);
  }

  // nil -- 0xc0
  readToken[0xc0] = constant(null);

  // (never used) -- 0xc1
  readToken[0xc1] = null;

  // false -- 0xc2
  // true -- 0xc3
  readToken[0xc2] = constant(false);
  readToken[0xc3] = constant(true);

  // bin 8 -- 0xc4
  // bin 16 -- 0xc5
  // bin 32 -- 0xc6
  readToken[0xc4] = flex(readFormat.uint8, readFormat.bin);
  readToken[0xc5] = flex(readFormat.uint16, readFormat.bin);
  readToken[0xc6] = flex(readFormat.uint32, readFormat.bin);

  // ext 8 -- 0xc7
  // ext 16 -- 0xc8
  // ext 32 -- 0xc9
  readToken[0xc7] = flex(readFormat.uint8, readFormat.ext);
  readToken[0xc8] = flex(readFormat.uint16, readFormat.ext);
  readToken[0xc9] = flex(readFormat.uint32, readFormat.ext);

  // float 32 -- 0xca
  // float 64 -- 0xcb
  readToken[0xca] = readFormat.float32;
  readToken[0xcb] = readFormat.float64;

  // uint 8 -- 0xcc
  // uint 16 -- 0xcd
  // uint 32 -- 0xce
  // uint 64 -- 0xcf
  readToken[0xcc] = readFormat.uint8;
  readToken[0xcd] = readFormat.uint16;
  readToken[0xce] = readFormat.uint32;
  readToken[0xcf] = readFormat.uint64;

  // int 8 -- 0xd0
  // int 16 -- 0xd1
  // int 32 -- 0xd2
  // int 64 -- 0xd3
  readToken[0xd0] = readFormat.int8;
  readToken[0xd1] = readFormat.int16;
  readToken[0xd2] = readFormat.int32;
  readToken[0xd3] = readFormat.int64;

  // fixext 1 -- 0xd4
  // fixext 2 -- 0xd5
  // fixext 4 -- 0xd6
  // fixext 8 -- 0xd7
  // fixext 16 -- 0xd8
  readToken[0xd4] = fix(1, readFormat.ext);
  readToken[0xd5] = fix(2, readFormat.ext);
  readToken[0xd6] = fix(4, readFormat.ext);
  readToken[0xd7] = fix(8, readFormat.ext);
  readToken[0xd8] = fix(16, readFormat.ext);

  // str 8 -- 0xd9
  // str 16 -- 0xda
  // str 32 -- 0xdb
  readToken[0xd9] = flex(readFormat.uint8, readFormat.str);
  readToken[0xda] = flex(readFormat.uint16, readFormat.str);
  readToken[0xdb] = flex(readFormat.uint32, readFormat.str);

  // negative fixint -- 0xe0 - 0xff
  for (i = 0xe0; i <= 0xff; ++i) {
    readToken[i] = constant(i - 0x100);
  }

  // fixmap -- 0x80 - 0x8f
  for (i = 0x80; i <= 0x8f; ++i) {
    readToken[i] = fix(i - 0x80, curriedMap);
  }

  // fixarray -- 0x90 - 0x9f
  for (i = 0x90; i <= 0x9f; ++i) {
    readToken[i] = fix(i - 0x90, curriedArray);
  }

  // array 16 -- 0xdc
  // array 32 -- 0xdd
  readToken[0xdc] = flex(readFormat.uint16, curriedArray);
  readToken[0xdd] = flex(readFormat.uint32, curriedArray);

  // map 16 -- 0xde
  // map 32 -- 0xdf
  readToken[0xde] = flex(readFormat.uint16, curriedMap);
  readToken[0xdf] = flex(readFormat.uint32, curriedMap);

  return readToken;
}
