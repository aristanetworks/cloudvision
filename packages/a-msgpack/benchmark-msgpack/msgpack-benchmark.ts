/* eslint-disable no-console, global-require, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-var-requires, import/no-dynamic-require */

import Benchmark from 'benchmark';

interface Implementation {
  encode: (d: unknown) => Uint8Array | string;
  decode: (d: Uint8Array | string) => unknown;
  toDecode?: Uint8Array | string;
}

const implementations: {
  [name: string]: Implementation;
} = {
  'a-msgpack': {
    encode: require('../src').encode,
    decode: require('../src').decode,
  },
  '@msgpack/msgpack': {
    encode: require('@msgpack/msgpack').encode,
    decode: require('@msgpack/msgpack').decode,
  },
  'msgpack-lite': {
    encode: require('msgpack-lite').encode,
    decode: require('msgpack-lite').decode,
  },
  'msgpack-js-v5': {
    encode: require('msgpack-js-v5').encode,
    decode: require('msgpack-js-v5').decode,
  },
  'msgpack-js': {
    encode: require('msgpack-js').encode,
    decode: require('msgpack-js').decode,
  },
  'notepack.io': {
    encode: require('notepack.io/browser/encode'),
    decode: require('notepack.io/browser/decode'),
  },
  JSON: {
    encode: (obj: unknown): string => JSON.stringify(obj),
    decode: (str: string | Uint8Array): unknown => JSON.parse(str as string),
  },
};

const sampleFiles = ['./sample-large.json'];

for (const sampleFile of sampleFiles) {
  const data = require(sampleFile);
  const encodeSuite = new Benchmark.Suite();
  const decodeSuite = new Benchmark.Suite();

  console.log('');
  console.log('**' + sampleFile + ':** (' + JSON.stringify(data).length + ' bytes in JSON)');
  console.log('');

  for (const name of Object.keys(implementations)) {
    implementations[name].toDecode = implementations[name].encode(data);
    encodeSuite.add('(encode) ' + name, () => {
      implementations[name].encode(data);
    });
    decodeSuite.add('(decode) ' + name, () => {
      implementations[name].decode(implementations[name].toDecode!);
    });
  }
  encodeSuite.on('cycle', (event: Event) => {
    console.log(String(event.target));
  });

  console.log('```');
  encodeSuite.run();
  console.log('```');

  console.log('');

  decodeSuite.on('cycle', (event: Event) => {
    console.log(String(event.target));
  });

  console.log('```');
  decodeSuite.run();
  console.log('```');
}
