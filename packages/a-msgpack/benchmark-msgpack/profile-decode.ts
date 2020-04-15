/* eslint-disable no-console, @typescript-eslint/no-var-requires */

import _ from 'lodash';

import { encode, decode } from '../src';

const data = require('./benchmark-from-msgpack-lite-data.json');

const dataX = _.cloneDeep(new Array(100).fill(data));
const encoded = encode(dataX);

console.log('encoded size:', encoded.byteLength);

console.time('decode #1');
for (let i = 0; i < 1000; i++) {
  decode(encoded);
}
console.timeEnd('decode #1');

console.time('decode #2');
for (let i = 0; i < 1000; i++) {
  decode(encoded);
}
console.timeEnd('decode #2');
