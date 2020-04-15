import { CachedKeyDecoder } from './CachedKeyDecoder';
import { Decoder } from './Decoder';
import { ExtensionCodecType } from './ExtensionCodec';

export interface DecodeOptions {
  /**
   * The extension codec to use.
   * Default is none
   */
  extensionCodec?: ExtensionCodecType;

  /**
   * Maximum string length.
   * Default to 4_294_967_295 (UINT32_MAX).
   */
  maxStrLength?: number;
  /**
   * Maximum binary length.
   * Default to 4_294_967_295 (UINT32_MAX).
   */
  maxBinLength?: number;
  /**
   * Maximum array length.
   * Default to 4_294_967_295 (UINT32_MAX).
   */
  maxArrayLength?: number;
  /**
   * Maximum map length.
   * Default to 4_294_967_295 (UINT32_MAX).
   */
  maxMapLength?: number;
  /**
   * Maximum extension length.
   * Default to 4_294_967_295 (UINT32_MAX).
   */
  maxExtLength?: number;

  /**
   * Force using JSBI, even if BigInt is available.
   * Default false.
   */
  useJSBI?: boolean;

  /**
   * Use a different caching implementation for decoding keys.
   * Passing null disables caching keys on decode.
   * Default CachedKeyDecoder implementation.
   */
  cachedKeyDecoder?: CachedKeyDecoder | null;
}

export const defaultDecodeOptions: DecodeOptions = {};

/**
 * It decodes a MessagePack-encoded buffer.
 *
 * This is a synchronous decoding function. See other variants for asynchronous decoding:
 * `decodeAsync()`, `decodeStream()`, and `decodeArrayStream()`
 */
export function decode(
  buffer: ArrayLike<number> | ArrayBuffer,
  options: DecodeOptions = defaultDecodeOptions,
): unknown {
  const decoder = new Decoder(
    options.extensionCodec,
    options.useJSBI,
    options.maxStrLength,
    options.maxBinLength,
    options.maxArrayLength,
    options.maxMapLength,
    options.maxExtLength,
    options.cachedKeyDecoder,
  );
  decoder.setBuffer(buffer); // decodeSync() requires only one buffer
  return decoder.decodeSingleSync();
}
