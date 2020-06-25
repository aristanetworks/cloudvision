# a-msgpack

MessagePack, but for Arista. This is based on the official msgpack library for JS
(@msgpack/msgpack), but implements our specific NEAT protocol.

## Installation

```bash
npm install a-msgpack
```

or

```bash
npm install a-msgpack
```

## Usage

```js
import { encode, decode, Codec } from 'a-msgpack';

const uint8array = msgpack.encode({ Dodgers: '#1', Astros: 'Cheaters' }, { extensionCodec: Codec });
const object = msgpack.decode(uint8array);
```

## Browser Support

In the browser, `a-msgpack` requires the
[Encoding API](https://developer.mozilla.org/en-US/docs/Web/API/Encoding_API) to work a peak
performance. If the Encoding API is unavailable, there is a fallback JS implementation.

## Benchmarks

The lastest code benchmarks and profiling is stored in `last-benchmark-results.txt`. This also
compares this implementation to other msgpack libraries. Note, that the decoding results should be
comparable to @msgpack/msgpack, but encoding will be slower because NEAT requires that map keys be
sorted by binary value.

## License

[MIT](https://github.com/JoshuaWise/tiny-msgpack/blob/trunk/LICENSE)
