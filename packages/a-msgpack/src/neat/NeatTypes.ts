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

/* eslint-disable max-classes-per-file */

import JSBI from 'jsbi';

import { Element, PathElements } from '../../types/neat';
import { isJsbi } from '../utils/data';

export class Float32 {
  public static type: 'float32' = 'float32';

  public type: 'float32';

  public value: number;

  /**
   * A class to represent an explicit float32
   */
  public constructor(value: unknown) {
    this.type = Float32.type;
    this.value = value ? parseFloat(String(value)) : 0.0; // undefined defaults to 0.0
  }

  public toString(): string {
    const strValue = this.value.toString();
    const hasDecimal = strValue.includes('.');
    return hasDecimal ? strValue : this.value.toFixed(1);
  }
}

export class Float64 {
  public static type: 'float64' = 'float64';

  public type: 'float64';

  public value: number;

  /**
   * A class to represent an explicit float64
   */
  public constructor(value: unknown) {
    this.type = Float64.type;
    this.value = value ? parseFloat(String(value)) : 0.0; // undefined defaults to 0.0
  }

  public toString(): string {
    const strValue = this.value.toString();
    const hasDecimal = strValue.includes('.');
    return hasDecimal ? strValue : this.value.toFixed(1);
  }
}

export class Int {
  public static type: 'int' = 'int';

  public type: 'int';

  public value: number | bigint | JSBI;

  /**
   * A class to represent an explicit int
   */
  public constructor(value: unknown, forceJSBI = false) {
    this.type = Int.type;
    if (typeof value === 'string') {
      let BI;
      if (typeof BigInt === 'undefined' || forceJSBI) {
        BI = JSBI.BigInt;
      } else {
        BI = BigInt;
      }

      this.value = BI(value);
    } else if (typeof value === 'bigint' || isJsbi(value)) {
      this.value = value as bigint | JSBI;
    } else {
      this.value = parseInt(String(value), 10);
    }
  }

  public toString(): string {
    return this.value.toString();
  }
}

export class Bool {
  public static type: 'bool' = 'bool';

  public type: 'bool';

  public value: boolean;

  /**
   * A class to represent an explicit boolean
   */
  public constructor(value: unknown) {
    this.type = Bool.type;
    this.value = !!value;
  }

  public toString(): string {
    return this.value ? 'true' : 'false';
  }
}

export class Nil {
  public static type: 'nil' = 'nil';

  public type: 'nil';

  public value: null;

  /**
   * A class to represent an explicit Nil
   */
  public constructor() {
    this.type = Nil.type;
    this.value = null;
  }

  public toString(): string {
    return 'null';
  }
}

export class Str {
  public static type: 'str' = 'str';

  public type: 'str';

  public value: string;

  /**
   * A class to represent an explicit String
   */
  public constructor(value: unknown) {
    this.type = Str.type;
    switch (typeof value) {
      case 'string':
        this.value = value;
        break;
      case 'bigint':
        this.value = value.toString();
        break;
      case 'undefined':
        this.value = '';
        break;
      default:
        this.value = JSON.stringify(value);
    }

    if (isJsbi(value)) {
      this.value = (value as JSBI).toString();
    }
  }

  public toString(): string {
    return this.value;
  }
}

export class Pointer {
  public static type: 'ptr' = 'ptr';

  public value: PathElements;

  public type: 'ptr';

  public delimiter: string;

  /**
   * A class to represent a Pointer type.
   * A Pointer is a pointer from one set of path elements to another.
   */
  public constructor(value: PathElements | string | unknown = []) {
    this.delimiter = '/';
    this.type = Pointer.type;
    let strValue: string;
    if (!Array.isArray(value)) {
      if (typeof value !== 'string') {
        strValue = JSON.stringify(value);
      } else {
        strValue = value;
      }

      const ptrArray: string[] = strValue.split(this.delimiter);
      while (ptrArray[0] === '') {
        ptrArray.shift();
      }
      this.value = ptrArray.map(
        (pathEl): Element => {
          try {
            return JSON.parse(pathEl);
          } catch (e) {
            // ignore errors, these are just regular strings
          }

          return pathEl;
        },
      );
    } else {
      this.value = value;
    }
  }

  public toString(): string {
    return this.value
      .map((pathEl): string => {
        if (typeof pathEl === 'string') {
          return pathEl;
        }
        return JSON.stringify(pathEl);
      })
      .join(this.delimiter);
  }
}

export class Wildcard {
  public static type: '*' = '*';

  public value: null;

  public type: '*';

  /**
   * A class to represent a Wildcard type.
   * A Wildcard is a type that matches 1 or more path elements
   */
  public constructor() {
    this.type = Wildcard.type;
    this.value = null;
  }

  public toString(): string {
    return '*';
  }
}
