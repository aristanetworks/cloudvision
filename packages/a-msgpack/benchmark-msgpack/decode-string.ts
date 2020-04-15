/* eslint-disable no-console */

import Benchmark from "benchmark";

import {
  utf8EncodeJs,
  utf8Count,
  utf8DecodeJs,
  utf8DecodeTD,
} from "../src/utils/utf8";

for (const baseStr of ["A", "あ", "🌏"]) {
  const dataSet = [10, 100, 200, 1_000, 10_000, 100_000].map((n) => {
    return baseStr.repeat(n);
  });

  for (const str of dataSet) {
    const byteLength = utf8Count(str);
    const bytes = new Uint8Array(new ArrayBuffer(byteLength));
    utf8EncodeJs(str, bytes, 0);

    console.log(
      `\n## string "${baseStr}" x ${str.length} (byteLength=${byteLength})\n`
    );

    const suite = new Benchmark.Suite();

    suite.add("utf8DecodeJs", () => {
      if (utf8DecodeJs(bytes, 0, byteLength) !== str) {
        throw new Error("wrong result!");
      }
    });

    suite.add("TextDecoder", () => {
      if (utf8DecodeTD(bytes, 0, byteLength) !== str) {
        throw new Error("wrong result!");
      }
    });
    suite.on("cycle", (event: any) => {
      console.log(String(event.target));
    });

    suite.run();
  }
}
