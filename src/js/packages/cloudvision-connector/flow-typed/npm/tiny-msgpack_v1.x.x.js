declare module 'tiny-msgpack' {
  declare class Codec {
    register: (
      etype: number,
      Class: Function,
      packer: (d: mixed) => Uint8Array,
      unpacker: (d: Uint8Array) => mixed,
    ) => void;
  }

  declare module.exports: {
    decode: (buffer: Uint8Array, codec?: Codec) => mixed,
    encode: (data: mixed, codec?: Codec) => Uint8Array,
    Codec: Class<Codec>,
  };
}
