/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable */
import Long from 'long';
import _m0 from '@arista/protobufjs/minimal';

export const protobufPackage = 'google.protobuf';

/**
 * `SourceContext` represents information about the source of a
 * protobuf element, like the file in which it is defined.
 */
export interface SourceContext {
  /**
   * The path-qualified name of the .proto file that contained the associated
   * protobuf element.  For example: `"google/protobuf/source_context.proto"`.
   */
  fileName: string;
}

const baseSourceContext: object = { fileName: '' };

export const SourceContext = {
  encode(message: SourceContext, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fileName !== '') {
      writer.uint32(10).string(message.fileName);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SourceContext {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseSourceContext } as SourceContext;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.fileName = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SourceContext {
    const message = { ...baseSourceContext } as SourceContext;
    if (object.fileName !== undefined && object.fileName !== null) {
      message.fileName = String(object.fileName);
    } else {
      message.fileName = '';
    }
    return message;
  },

  toJSON(message: SourceContext): unknown {
    const obj: any = {};
    message.fileName !== undefined && (obj.fileName = message.fileName);
    return obj;
  },

  fromPartial(object: DeepPartial<SourceContext>): SourceContext {
    const message = { ...baseSourceContext } as SourceContext;
    if (object.fileName !== undefined && object.fileName !== null) {
      message.fileName = object.fileName;
    } else {
      message.fileName = '';
    }
    return message;
  },
};

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;
export type DeepPartial<T> = T extends Builtin
  ? T
  : T extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : T extends {}
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}
