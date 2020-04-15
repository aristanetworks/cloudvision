import JSBI from 'jsbi';

// DataView extension to handle int64 / uint64,
// where the actual range is 53-bits integer (a.k.a. safe integer)

export function bufferToString(high: number, low: number, unsigned: boolean): string {
  let highNum = high;
  let lowNum = low;

  const radix = 10;
  const sign = !unsigned && high & 0x80000000;
  if (sign) {
    highNum = ~high;
    lowNum = 0x1_0000_0000 - low;
  }
  let str = '';
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const mod = (highNum % radix) * 0x1_0000_0000 + lowNum;
    highNum = Math.floor(highNum / radix);
    lowNum = Math.floor(mod / radix);
    str = (mod % radix).toString(radix) + str;
    if (!highNum && !lowNum) {
      break;
    }
  }
  if (sign) {
    str = '-' + str;
  }

  return str;
}

function fromStringToBuffer(view: DataView, offset: number, str: string): void {
  const radix = 10;
  let pos = 0;
  const len = str.length;
  let highNum = 0;
  let lowNum = 0;
  if (str[0] === '-') {
    pos++;
  }
  const sign = pos;
  while (pos < len) {
    const chr = parseInt(str[pos++], radix);
    if (Number.isNaN(chr) || chr < 0) {
      // NaN
      break;
    }
    lowNum = lowNum * radix + chr;
    highNum = highNum * radix + Math.floor(lowNum / 0x1_0000_0000);
    lowNum %= 0x1_0000_0000;
  }
  if (sign) {
    highNum = ~highNum;
    if (lowNum) {
      lowNum = 0x1_0000_0000 - lowNum;
    } else {
      highNum++;
    }
  }
  view.setUint32(offset, highNum);
  view.setUint32(offset + 4, lowNum);
}

export function setUint64(view: DataView, offset: number, value: bigint | string | number): void {
  if (typeof value === 'number') {
    const high = value / 0x1_0000_0000;
    const low = value; // high bits are truncated by DataView
    view.setUint32(offset, high);
    view.setUint32(offset + 4, low);
  } else if (typeof value === 'bigint') {
    view.setBigUint64(offset, value);
  } else if (typeof value === 'string') {
    fromStringToBuffer(view, offset, value);
  }
}

export function setInt64(view: DataView, offset: number, value: bigint | string | number): void {
  if (typeof value === 'number') {
    const high = Math.floor(value / 0x1_0000_0000);
    const low = value; // high bits are truncated by DataView
    view.setUint32(offset, high);
    view.setUint32(offset + 4, low);
  } else if (typeof value === 'bigint') {
    view.setBigInt64(offset, value);
  } else if (typeof value === 'string') {
    fromStringToBuffer(view, offset, value);
  }
}

export function getInt64(view: DataView, offset: number, useJSBI: boolean): bigint | JSBI {
  if (!view.getBigInt64 || useJSBI) {
    const high = view.getInt32(offset);
    const low = view.getUint32(offset + 4);
    return JSBI.BigInt(bufferToString(high, low, false));
  }
  return view.getBigInt64(offset);
}

export function getUint64(view: DataView, offset: number, useJSBI: boolean): bigint | JSBI {
  if (!view.getBigUint64 || useJSBI) {
    const high = view.getUint32(offset);
    const low = view.getUint32(offset + 4);
    return JSBI.BigInt(bufferToString(high, low, true));
  }
  return view.getBigUint64(offset);
}
