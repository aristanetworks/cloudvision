/* eslint-disable no-console, @typescript-eslint/no-var-requires */

import _ from 'lodash';

import { encode } from '../src';

const data = require('./benchmark-from-msgpack-lite-data.json');

const dataX = _.cloneDeep(new Array(100).fill(data));

console.time('encode #1');
for (let i = 0; i < 1000; i++) {
  encode(dataX);
}
console.timeEnd('encode #1');

console.time('encode #2');
for (let i = 0; i < 1000; i++) {
  encode(dataX);
}
console.timeEnd('encode #2');
