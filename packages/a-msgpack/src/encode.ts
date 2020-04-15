import { Encoder } from './Encoder';
import { ExtensionCodecType } from './ExtensionCodec';

export interface EncodeOptions {
  /**
   * The extension codec to use.
   * Default is none
   */
  extensionCodec?: ExtensionCodecType;
  /**
   * The maximum object depth
   * Default 100
   */
  maxDepth?: number;
  /**
   * The size of the buffer when beginning encoding.
   * This is the minimum amount of memory allocated.
   * Default 2048
   */
  initialBufferSize?: number;
}

const defaultEncodeOptions = {};

/**
 * It encodes `value` in the MessagePack format and
 * returns a byte buffer.
 *
 * The returned buffer is a slice of a larger `ArrayBuffer`, so you have to use its `#byteOffset`
 * and `#byteLength` in order to convert it to another typed arrays including NodeJS `Buffer`.
 */
export function encode(value: unknown, options: EncodeOptions = defaultEncodeOptions): Uint8Array {
  const encoder = new Encoder(options.extensionCodec, options.maxDepth, options.initialBufferSize);
  encoder.encode(value, 1);
  return encoder.getUint8Array();
}
