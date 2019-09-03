/* @flow */
// Copyright (c) 2018, Arista Networks, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software
// and associated documentation files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all copies or
// substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import JSBI from 'jsbi';

import type { PathElements } from '../utils';

/*
 * A class to represent an explicit float32
 */
export class Float32 {
  static type: 'float32' = 'float32';

  type: 'float32';

  value: number;

  constructor(value: mixed) {
    this.type = Float32.type;
    this.value = value ? parseFloat(value) : 0.0; // undefined defaults to 0.0
  }

  toString(): string {
    const strValue = this.value.toString();
    const hasDecimal = strValue.includes('.');
    return hasDecimal ? strValue : this.value.toFixed(1);
  }
}

/*
 * A class to represent an explicit float64
 */
export class Float64 {
  static type: 'float64' = 'float64';

  type: 'float64';

  value: number;

  constructor(value: mixed) {
    this.type = Float64.type;
    this.value = value ? parseFloat(value) : 0.0; // undefined defaults to 0.0
  }

  toString(): string {
    const strValue = this.value.toString();
    const hasDecimal = strValue.includes('.');
    return hasDecimal ? strValue : this.value.toFixed(1);
  }
}

/*
 * A class to represent an explicit int
 */
export class Int {
  static type: 'int' = 'int';

  type: 'int';

  value: number;

  constructor(value: mixed, forceJSBI: boolean = false) {
    this.type = Int.type;
    if (typeof value === 'string') {
      let BI;
      // $FlowFixMe
      if (typeof BigInt === 'undefined' || forceJSBI) {
        BI = JSBI.BigInt;
      } else {
        BI = BigInt;
      }

      this.value =
        parseInt(value, 10) > Number.MAX_SAFE_INTEGER ||
        parseInt(value, 10) < Number.MAX_SAFE_INTEGER * -1
          ? BI(value)
          : parseInt(value, 10);
      // $FlowFixMe
    } else if (typeof value === 'bigint' || value instanceof JSBI) {
      // $FlowFixMe
      this.value = value;
    } else {
      this.value = parseInt(value, 10);
    }
  }

  toString(): string {
    return this.value.toString();
  }
}

/*
 * A class to represent an explicit boolean
 */
export class Bool {
  static type: 'bool' = 'bool';

  type: 'bool';

  value: boolean;

  constructor(value: mixed) {
    this.type = Bool.type;
    this.value = !!value;
  }

  toString(): string {
    return this.value ? 'true' : 'false';
  }
}

/*
 * A class to represent an explicit Nil
 */
export class Nil {
  static type: 'nil' = 'nil';

  type: 'nil';

  value: null;

  constructor() {
    this.type = Nil.type;
    this.value = null;
  }

  toString(): string {
    return 'null';
  }
}

/*
 * A class to represent an explicit String
 */
export class Str {
  static type: 'str' = 'str';

  type: 'str';

  value: string;

  constructor(value: mixed) {
    this.type = Str.type;
    switch (typeof value) {
      case 'string':
        this.value = value;
        break;
      // $FlowFixMe
      case 'bigint':
        // $FlowFixMe
        this.value = value.toString();
        break;
      case 'undefined':
        this.value = '';
        break;
      default:
        // $FlowFixMe this will never be void, because of the `undefined` case
        this.value = JSON.stringify(value);
    }

    if (value instanceof JSBI) {
      this.value = value.toString();
    }
  }

  toString(): string {
    return this.value;
  }
}

export class Pointer {
  static type: 'ptr' = 'ptr';

  value: PathElements;

  type: 'ptr';

  delimiter: string;

  constructor(value: PathElements = []) {
    this.delimiter = '/';
    this.value = value;
    this.type = Pointer.type;
    if (typeof value === 'string') {
      const ptrArray = value.split(this.delimiter);
      while (ptrArray[0] === '') {
        ptrArray.shift();
      }
      this.value = ptrArray.map((pathEl) => {
        try {
          return JSON.parse(pathEl);
        } catch (e) {
          // ignore errors, these are just regular strings
        }

        return pathEl;
      });
    }
  }

  toString(): string {
    return this.value
      .map((pathEl) => {
        if (typeof pathEl === 'string') {
          return pathEl;
        }
        return JSON.stringify(pathEl);
      })
      .join(this.delimiter);
  }
}
