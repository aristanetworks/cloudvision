// ExtensionCodec to handle MessagePack extensions

import { ExtData } from './ExtData';

export type ExtensionDecoderType = (data: Uint8Array, extensionType: number) => unknown;

export type ExtensionEncoderType = (input: unknown) => Uint8Array | null;

export interface ExtensionCodecType {
  tryToEncode(object: unknown): ExtData | null;
  decode(data: Uint8Array, extType: number): unknown;
}

export class ExtensionCodec implements ExtensionCodecType {
  public static readonly defaultCodec: ExtensionCodecType = new ExtensionCodec();

  // custom extensions
  private readonly encoders: ExtensionEncoderType[] = [];

  private readonly decoders: ExtensionDecoderType[] = [];

  public register({
    type,
    encode,
    decode,
  }: {
    type: number;
    encode: ExtensionEncoderType;
    decode: ExtensionDecoderType;
  }): void {
    this.encoders[type] = encode;
    this.decoders[type] = decode;
  }

  public tryToEncode(object: unknown): ExtData | null {
    // custom extensions
    for (let i = 0; i < this.encoders.length; i++) {
      const encoder = this.encoders[i];
      const data = encoder(object);
      if (data != null) {
        const type = i;
        return new ExtData(type, data);
      }
    }
    return null;
  }

  public decode(data: Uint8Array, type: number): unknown {
    const decoder = this.decoders[type];
    return decoder(data, type);
  }
}
