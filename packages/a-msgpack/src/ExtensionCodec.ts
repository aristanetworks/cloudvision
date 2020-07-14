// ExtensionCodec to handle MessagePack extensions

import { ExtData } from './ExtData';

export type ExtensionDecoderType = (data: Uint8Array, extensionType: number) => unknown;
export type ExtensionEncoderType<T> = (input: T) => Uint8Array;
export type ExtensionIdentifier = (ext: unknown) => boolean;

export interface ExtensionCodecType {
  encode(object: unknown): ExtData;
  decode(data: Uint8Array, extType: number): unknown;
}

export class ExtensionCodec implements ExtensionCodecType {
  public static readonly defaultCodec: ExtensionCodecType = new ExtensionCodec();

  // custom extensions
  private readonly encoders: ExtensionEncoderType<any>[] = [];

  private readonly decoders: ExtensionDecoderType[] = [];

  private readonly identifiers: ExtensionIdentifier[] = [];

  public register<EncodeType>({
    type,
    identifier,
    encode,
    decode,
  }: {
    type: number;
    identifier: ExtensionIdentifier;
    encode: ExtensionEncoderType<EncodeType>;
    decode: ExtensionDecoderType;
  }): void {
    this.encoders[type] = encode;
    this.decoders[type] = decode;
    this.identifiers.push(identifier);
  }

  public encode(object: unknown): ExtData {
    let type = null;
    for (let i = 0; i < this.identifiers.length; i++) {
      const id = this.identifiers[i];
      if (id(object)) {
        type = i;
      }
    }
    if (type === null) {
      throw new Error(`Unrecognized object: ${Object.prototype.toString.apply(object)}`);
    }
    const encoder = this.encoders[type];
    const data = encoder(object);
    return new ExtData(type, data);
  }

  public decode(data: Uint8Array, type: number): unknown {
    const decoder = this.decoders[type];
    return decoder(data, type);
  }
}
