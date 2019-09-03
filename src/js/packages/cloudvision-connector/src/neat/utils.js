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

function sortByBinaryValue(a: Array<number>, b: Array<number>): number {
  const len = Math.min(a.length, b.length);

  if (a === b) {
    return 0;
  }

  for (let i = 0; i < len; i += 1) {
    if (a[i] !== b[i]) {
      return a[i] - b[i];
    }
  }

  return a.length - b.length;
}

export function sortMapByKey(a: Array<any>, b: Array<any>) {
  const aVal = a[0];
  const bVal = b[0];

  return sortByBinaryValue(aVal, bVal);
}
