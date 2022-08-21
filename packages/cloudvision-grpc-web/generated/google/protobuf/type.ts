/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable */
import Long from 'long';
import _m0 from '@arista/protobufjs/minimal';
import { SourceContext } from '../../google/protobuf/source_context';
import { Any } from '../../google/protobuf/any';

export const protobufPackage = 'google.protobuf';

/** The syntax in which a protocol buffer element is defined. */
export enum Syntax {
  /** SYNTAX_PROTO2 - Syntax `proto2`. */
  SYNTAX_PROTO2 = 0,
  /** SYNTAX_PROTO3 - Syntax `proto3`. */
  SYNTAX_PROTO3 = 1,
  UNRECOGNIZED = -1,
}

export function syntaxFromJSON(object: any): Syntax {
  switch (object) {
    case 0:
    case 'SYNTAX_PROTO2':
      return Syntax.SYNTAX_PROTO2;
    case 1:
    case 'SYNTAX_PROTO3':
      return Syntax.SYNTAX_PROTO3;
    case -1:
    case 'UNRECOGNIZED':
    default:
      return Syntax.UNRECOGNIZED;
  }
}

export function syntaxToJSON(object: Syntax): string {
  switch (object) {
    case Syntax.SYNTAX_PROTO2:
      return 'SYNTAX_PROTO2';
    case Syntax.SYNTAX_PROTO3:
      return 'SYNTAX_PROTO3';
    default:
      return 'UNKNOWN';
  }
}

/** A protocol buffer message type. */
export interface Type {
  /** The fully qualified message name. */
  name: string;
  /** The list of fields. */
  fields: Field[];
  /** The list of types appearing in `oneof` definitions in this type. */
  oneofs: string[];
  /** The protocol buffer options. */
  options: Option[];
  /** The source context. */
  sourceContext: SourceContext | undefined;
  /** The source syntax. */
  syntax: Syntax;
}

/** A single field of a message type. */
export interface Field {
  /** The field type. */
  kind: Field_Kind;
  /** The field cardinality. */
  cardinality: Field_Cardinality;
  /** The field number. */
  number: number;
  /** The field name. */
  name: string;
  /**
   * The field type URL, without the scheme, for message or enumeration
   * types. Example: `"type.googleapis.com/google.protobuf.Timestamp"`.
   */
  typeUrl: string;
  /**
   * The index of the field type in `Type.oneofs`, for message or enumeration
   * types. The first type has index 1; zero means the type is not in the list.
   */
  oneofIndex: number;
  /** Whether to use alternative packed wire representation. */
  packed: boolean;
  /** The protocol buffer options. */
  options: Option[];
  /** The field JSON name. */
  jsonName: string;
  /** The string value of the default value of this field. Proto2 syntax only. */
  defaultValue: string;
}

/** Basic field types. */
export enum Field_Kind {
  /** TYPE_UNKNOWN - Field type unknown. */
  TYPE_UNKNOWN = 0,
  /** TYPE_DOUBLE - Field type double. */
  TYPE_DOUBLE = 1,
  /** TYPE_FLOAT - Field type float. */
  TYPE_FLOAT = 2,
  /** TYPE_INT64 - Field type int64. */
  TYPE_INT64 = 3,
  /** TYPE_UINT64 - Field type uint64. */
  TYPE_UINT64 = 4,
  /** TYPE_INT32 - Field type int32. */
  TYPE_INT32 = 5,
  /** TYPE_FIXED64 - Field type fixed64. */
  TYPE_FIXED64 = 6,
  /** TYPE_FIXED32 - Field type fixed32. */
  TYPE_FIXED32 = 7,
  /** TYPE_BOOL - Field type bool. */
  TYPE_BOOL = 8,
  /** TYPE_STRING - Field type string. */
  TYPE_STRING = 9,
  /** TYPE_GROUP - Field type group. Proto2 syntax only, and deprecated. */
  TYPE_GROUP = 10,
  /** TYPE_MESSAGE - Field type message. */
  TYPE_MESSAGE = 11,
  /** TYPE_BYTES - Field type bytes. */
  TYPE_BYTES = 12,
  /** TYPE_UINT32 - Field type uint32. */
  TYPE_UINT32 = 13,
  /** TYPE_ENUM - Field type enum. */
  TYPE_ENUM = 14,
  /** TYPE_SFIXED32 - Field type sfixed32. */
  TYPE_SFIXED32 = 15,
  /** TYPE_SFIXED64 - Field type sfixed64. */
  TYPE_SFIXED64 = 16,
  /** TYPE_SINT32 - Field type sint32. */
  TYPE_SINT32 = 17,
  /** TYPE_SINT64 - Field type sint64. */
  TYPE_SINT64 = 18,
  UNRECOGNIZED = -1,
}

export function field_KindFromJSON(object: any): Field_Kind {
  switch (object) {
    case 0:
    case 'TYPE_UNKNOWN':
      return Field_Kind.TYPE_UNKNOWN;
    case 1:
    case 'TYPE_DOUBLE':
      return Field_Kind.TYPE_DOUBLE;
    case 2:
    case 'TYPE_FLOAT':
      return Field_Kind.TYPE_FLOAT;
    case 3:
    case 'TYPE_INT64':
      return Field_Kind.TYPE_INT64;
    case 4:
    case 'TYPE_UINT64':
      return Field_Kind.TYPE_UINT64;
    case 5:
    case 'TYPE_INT32':
      return Field_Kind.TYPE_INT32;
    case 6:
    case 'TYPE_FIXED64':
      return Field_Kind.TYPE_FIXED64;
    case 7:
    case 'TYPE_FIXED32':
      return Field_Kind.TYPE_FIXED32;
    case 8:
    case 'TYPE_BOOL':
      return Field_Kind.TYPE_BOOL;
    case 9:
    case 'TYPE_STRING':
      return Field_Kind.TYPE_STRING;
    case 10:
    case 'TYPE_GROUP':
      return Field_Kind.TYPE_GROUP;
    case 11:
    case 'TYPE_MESSAGE':
      return Field_Kind.TYPE_MESSAGE;
    case 12:
    case 'TYPE_BYTES':
      return Field_Kind.TYPE_BYTES;
    case 13:
    case 'TYPE_UINT32':
      return Field_Kind.TYPE_UINT32;
    case 14:
    case 'TYPE_ENUM':
      return Field_Kind.TYPE_ENUM;
    case 15:
    case 'TYPE_SFIXED32':
      return Field_Kind.TYPE_SFIXED32;
    case 16:
    case 'TYPE_SFIXED64':
      return Field_Kind.TYPE_SFIXED64;
    case 17:
    case 'TYPE_SINT32':
      return Field_Kind.TYPE_SINT32;
    case 18:
    case 'TYPE_SINT64':
      return Field_Kind.TYPE_SINT64;
    case -1:
    case 'UNRECOGNIZED':
    default:
      return Field_Kind.UNRECOGNIZED;
  }
}

export function field_KindToJSON(object: Field_Kind): string {
  switch (object) {
    case Field_Kind.TYPE_UNKNOWN:
      return 'TYPE_UNKNOWN';
    case Field_Kind.TYPE_DOUBLE:
      return 'TYPE_DOUBLE';
    case Field_Kind.TYPE_FLOAT:
      return 'TYPE_FLOAT';
    case Field_Kind.TYPE_INT64:
      return 'TYPE_INT64';
    case Field_Kind.TYPE_UINT64:
      return 'TYPE_UINT64';
    case Field_Kind.TYPE_INT32:
      return 'TYPE_INT32';
    case Field_Kind.TYPE_FIXED64:
      return 'TYPE_FIXED64';
    case Field_Kind.TYPE_FIXED32:
      return 'TYPE_FIXED32';
    case Field_Kind.TYPE_BOOL:
      return 'TYPE_BOOL';
    case Field_Kind.TYPE_STRING:
      return 'TYPE_STRING';
    case Field_Kind.TYPE_GROUP:
      return 'TYPE_GROUP';
    case Field_Kind.TYPE_MESSAGE:
      return 'TYPE_MESSAGE';
    case Field_Kind.TYPE_BYTES:
      return 'TYPE_BYTES';
    case Field_Kind.TYPE_UINT32:
      return 'TYPE_UINT32';
    case Field_Kind.TYPE_ENUM:
      return 'TYPE_ENUM';
    case Field_Kind.TYPE_SFIXED32:
      return 'TYPE_SFIXED32';
    case Field_Kind.TYPE_SFIXED64:
      return 'TYPE_SFIXED64';
    case Field_Kind.TYPE_SINT32:
      return 'TYPE_SINT32';
    case Field_Kind.TYPE_SINT64:
      return 'TYPE_SINT64';
    default:
      return 'UNKNOWN';
  }
}

/** Whether a field is optional, required, or repeated. */
export enum Field_Cardinality {
  /** CARDINALITY_UNKNOWN - For fields with unknown cardinality. */
  CARDINALITY_UNKNOWN = 0,
  /** CARDINALITY_OPTIONAL - For optional fields. */
  CARDINALITY_OPTIONAL = 1,
  /** CARDINALITY_REQUIRED - For required fields. Proto2 syntax only. */
  CARDINALITY_REQUIRED = 2,
  /** CARDINALITY_REPEATED - For repeated fields. */
  CARDINALITY_REPEATED = 3,
  UNRECOGNIZED = -1,
}

export function field_CardinalityFromJSON(object: any): Field_Cardinality {
  switch (object) {
    case 0:
    case 'CARDINALITY_UNKNOWN':
      return Field_Cardinality.CARDINALITY_UNKNOWN;
    case 1:
    case 'CARDINALITY_OPTIONAL':
      return Field_Cardinality.CARDINALITY_OPTIONAL;
    case 2:
    case 'CARDINALITY_REQUIRED':
      return Field_Cardinality.CARDINALITY_REQUIRED;
    case 3:
    case 'CARDINALITY_REPEATED':
      return Field_Cardinality.CARDINALITY_REPEATED;
    case -1:
    case 'UNRECOGNIZED':
    default:
      return Field_Cardinality.UNRECOGNIZED;
  }
}

export function field_CardinalityToJSON(object: Field_Cardinality): string {
  switch (object) {
    case Field_Cardinality.CARDINALITY_UNKNOWN:
      return 'CARDINALITY_UNKNOWN';
    case Field_Cardinality.CARDINALITY_OPTIONAL:
      return 'CARDINALITY_OPTIONAL';
    case Field_Cardinality.CARDINALITY_REQUIRED:
      return 'CARDINALITY_REQUIRED';
    case Field_Cardinality.CARDINALITY_REPEATED:
      return 'CARDINALITY_REPEATED';
    default:
      return 'UNKNOWN';
  }
}

/** Enum type definition. */
export interface Enum {
  /** Enum type name. */
  name: string;
  /** Enum value definitions. */
  enumvalue: EnumValue[];
  /** Protocol buffer options. */
  options: Option[];
  /** The source context. */
  sourceContext: SourceContext | undefined;
  /** The source syntax. */
  syntax: Syntax;
}

/** Enum value definition. */
export interface EnumValue {
  /** Enum value name. */
  name: string;
  /** Enum value number. */
  number: number;
  /** Protocol buffer options. */
  options: Option[];
}

/**
 * A protocol buffer option, which can be attached to a message, field,
 * enumeration, etc.
 */
export interface Option {
  /**
   * The option's name. For protobuf built-in options (options defined in
   * descriptor.proto), this is the short name. For example, `"map_entry"`.
   * For custom options, it should be the fully-qualified name. For example,
   * `"google.api.http"`.
   */
  name: string;
  /**
   * The option's value packed in an Any message. If the value is a primitive,
   * the corresponding wrapper type defined in google/protobuf/wrappers.proto
   * should be used. If the value is an enum, it should be stored as an int32
   * value using the google.protobuf.Int32Value type.
   */
  value: Any | undefined;
}

const baseType: object = { name: '', oneofs: '', syntax: 0 };

export const Type = {
  encode(message: Type, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== '') {
      writer.uint32(10).string(message.name);
    }
    for (const v of message.fields) {
      Field.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.oneofs) {
      writer.uint32(26).string(v!);
    }
    for (const v of message.options) {
      Option.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    if (message.sourceContext !== undefined) {
      SourceContext.encode(message.sourceContext, writer.uint32(42).fork()).ldelim();
    }
    if (message.syntax !== 0) {
      writer.uint32(48).int32(message.syntax);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Type {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseType } as Type;
    message.fields = [];
    message.oneofs = [];
    message.options = [];
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.name = reader.string();
          break;
        case 2:
          message.fields.push(Field.decode(reader, reader.uint32()));
          break;
        case 3:
          message.oneofs.push(reader.string());
          break;
        case 4:
          message.options.push(Option.decode(reader, reader.uint32()));
          break;
        case 5:
          message.sourceContext = SourceContext.decode(reader, reader.uint32());
          break;
        case 6:
          message.syntax = reader.int32() as any;
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Type {
    const message = { ...baseType } as Type;
    message.fields = [];
    message.oneofs = [];
    message.options = [];
    if (object.name !== undefined && object.name !== null) {
      message.name = String(object.name);
    } else {
      message.name = '';
    }
    if (object.fields !== undefined && object.fields !== null) {
      for (const e of object.fields) {
        message.fields.push(Field.fromJSON(e));
      }
    }
    if (object.oneofs !== undefined && object.oneofs !== null) {
      for (const e of object.oneofs) {
        message.oneofs.push(String(e));
      }
    }
    if (object.options !== undefined && object.options !== null) {
      for (const e of object.options) {
        message.options.push(Option.fromJSON(e));
      }
    }
    if (object.sourceContext !== undefined && object.sourceContext !== null) {
      message.sourceContext = SourceContext.fromJSON(object.sourceContext);
    } else {
      message.sourceContext = undefined;
    }
    if (object.syntax !== undefined && object.syntax !== null) {
      message.syntax = syntaxFromJSON(object.syntax);
    } else {
      message.syntax = 0;
    }
    return message;
  },

  toJSON(message: Type): unknown {
    const obj: any = {};
    message.name !== undefined && (obj.name = message.name);
    if (message.fields) {
      obj.fields = message.fields.map((e) => (e ? Field.toJSON(e) : undefined));
    } else {
      obj.fields = [];
    }
    if (message.oneofs) {
      obj.oneofs = message.oneofs.map((e) => e);
    } else {
      obj.oneofs = [];
    }
    if (message.options) {
      obj.options = message.options.map((e) => (e ? Option.toJSON(e) : undefined));
    } else {
      obj.options = [];
    }
    message.sourceContext !== undefined &&
      (obj.sourceContext = message.sourceContext
        ? SourceContext.toJSON(message.sourceContext)
        : undefined);
    message.syntax !== undefined && (obj.syntax = syntaxToJSON(message.syntax));
    return obj;
  },

  fromPartial(object: DeepPartial<Type>): Type {
    const message = { ...baseType } as Type;
    message.fields = [];
    message.oneofs = [];
    message.options = [];
    if (object.name !== undefined && object.name !== null) {
      message.name = object.name;
    } else {
      message.name = '';
    }
    if (object.fields !== undefined && object.fields !== null) {
      for (const e of object.fields) {
        message.fields.push(Field.fromPartial(e));
      }
    }
    if (object.oneofs !== undefined && object.oneofs !== null) {
      for (const e of object.oneofs) {
        message.oneofs.push(e);
      }
    }
    if (object.options !== undefined && object.options !== null) {
      for (const e of object.options) {
        message.options.push(Option.fromPartial(e));
      }
    }
    if (object.sourceContext !== undefined && object.sourceContext !== null) {
      message.sourceContext = SourceContext.fromPartial(object.sourceContext);
    } else {
      message.sourceContext = undefined;
    }
    if (object.syntax !== undefined && object.syntax !== null) {
      message.syntax = object.syntax;
    } else {
      message.syntax = 0;
    }
    return message;
  },
};

const baseField: object = {
  kind: 0,
  cardinality: 0,
  number: 0,
  name: '',
  typeUrl: '',
  oneofIndex: 0,
  packed: false,
  jsonName: '',
  defaultValue: '',
};

export const Field = {
  encode(message: Field, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.kind !== 0) {
      writer.uint32(8).int32(message.kind);
    }
    if (message.cardinality !== 0) {
      writer.uint32(16).int32(message.cardinality);
    }
    if (message.number !== 0) {
      writer.uint32(24).int32(message.number);
    }
    if (message.name !== '') {
      writer.uint32(34).string(message.name);
    }
    if (message.typeUrl !== '') {
      writer.uint32(50).string(message.typeUrl);
    }
    if (message.oneofIndex !== 0) {
      writer.uint32(56).int32(message.oneofIndex);
    }
    if (message.packed === true) {
      writer.uint32(64).bool(message.packed);
    }
    for (const v of message.options) {
      Option.encode(v!, writer.uint32(74).fork()).ldelim();
    }
    if (message.jsonName !== '') {
      writer.uint32(82).string(message.jsonName);
    }
    if (message.defaultValue !== '') {
      writer.uint32(90).string(message.defaultValue);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Field {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseField } as Field;
    message.options = [];
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.kind = reader.int32() as any;
          break;
        case 2:
          message.cardinality = reader.int32() as any;
          break;
        case 3:
          message.number = reader.int32();
          break;
        case 4:
          message.name = reader.string();
          break;
        case 6:
          message.typeUrl = reader.string();
          break;
        case 7:
          message.oneofIndex = reader.int32();
          break;
        case 8:
          message.packed = reader.bool();
          break;
        case 9:
          message.options.push(Option.decode(reader, reader.uint32()));
          break;
        case 10:
          message.jsonName = reader.string();
          break;
        case 11:
          message.defaultValue = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Field {
    const message = { ...baseField } as Field;
    message.options = [];
    if (object.kind !== undefined && object.kind !== null) {
      message.kind = field_KindFromJSON(object.kind);
    } else {
      message.kind = 0;
    }
    if (object.cardinality !== undefined && object.cardinality !== null) {
      message.cardinality = field_CardinalityFromJSON(object.cardinality);
    } else {
      message.cardinality = 0;
    }
    if (object.number !== undefined && object.number !== null) {
      message.number = Number(object.number);
    } else {
      message.number = 0;
    }
    if (object.name !== undefined && object.name !== null) {
      message.name = String(object.name);
    } else {
      message.name = '';
    }
    if (object.typeUrl !== undefined && object.typeUrl !== null) {
      message.typeUrl = String(object.typeUrl);
    } else {
      message.typeUrl = '';
    }
    if (object.oneofIndex !== undefined && object.oneofIndex !== null) {
      message.oneofIndex = Number(object.oneofIndex);
    } else {
      message.oneofIndex = 0;
    }
    if (object.packed !== undefined && object.packed !== null) {
      message.packed = Boolean(object.packed);
    } else {
      message.packed = false;
    }
    if (object.options !== undefined && object.options !== null) {
      for (const e of object.options) {
        message.options.push(Option.fromJSON(e));
      }
    }
    if (object.jsonName !== undefined && object.jsonName !== null) {
      message.jsonName = String(object.jsonName);
    } else {
      message.jsonName = '';
    }
    if (object.defaultValue !== undefined && object.defaultValue !== null) {
      message.defaultValue = String(object.defaultValue);
    } else {
      message.defaultValue = '';
    }
    return message;
  },

  toJSON(message: Field): unknown {
    const obj: any = {};
    message.kind !== undefined && (obj.kind = field_KindToJSON(message.kind));
    message.cardinality !== undefined &&
      (obj.cardinality = field_CardinalityToJSON(message.cardinality));
    message.number !== undefined && (obj.number = message.number);
    message.name !== undefined && (obj.name = message.name);
    message.typeUrl !== undefined && (obj.typeUrl = message.typeUrl);
    message.oneofIndex !== undefined && (obj.oneofIndex = message.oneofIndex);
    message.packed !== undefined && (obj.packed = message.packed);
    if (message.options) {
      obj.options = message.options.map((e) => (e ? Option.toJSON(e) : undefined));
    } else {
      obj.options = [];
    }
    message.jsonName !== undefined && (obj.jsonName = message.jsonName);
    message.defaultValue !== undefined && (obj.defaultValue = message.defaultValue);
    return obj;
  },

  fromPartial(object: DeepPartial<Field>): Field {
    const message = { ...baseField } as Field;
    message.options = [];
    if (object.kind !== undefined && object.kind !== null) {
      message.kind = object.kind;
    } else {
      message.kind = 0;
    }
    if (object.cardinality !== undefined && object.cardinality !== null) {
      message.cardinality = object.cardinality;
    } else {
      message.cardinality = 0;
    }
    if (object.number !== undefined && object.number !== null) {
      message.number = object.number;
    } else {
      message.number = 0;
    }
    if (object.name !== undefined && object.name !== null) {
      message.name = object.name;
    } else {
      message.name = '';
    }
    if (object.typeUrl !== undefined && object.typeUrl !== null) {
      message.typeUrl = object.typeUrl;
    } else {
      message.typeUrl = '';
    }
    if (object.oneofIndex !== undefined && object.oneofIndex !== null) {
      message.oneofIndex = object.oneofIndex;
    } else {
      message.oneofIndex = 0;
    }
    if (object.packed !== undefined && object.packed !== null) {
      message.packed = object.packed;
    } else {
      message.packed = false;
    }
    if (object.options !== undefined && object.options !== null) {
      for (const e of object.options) {
        message.options.push(Option.fromPartial(e));
      }
    }
    if (object.jsonName !== undefined && object.jsonName !== null) {
      message.jsonName = object.jsonName;
    } else {
      message.jsonName = '';
    }
    if (object.defaultValue !== undefined && object.defaultValue !== null) {
      message.defaultValue = object.defaultValue;
    } else {
      message.defaultValue = '';
    }
    return message;
  },
};

const baseEnum: object = { name: '', syntax: 0 };

export const Enum = {
  encode(message: Enum, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== '') {
      writer.uint32(10).string(message.name);
    }
    for (const v of message.enumvalue) {
      EnumValue.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.options) {
      Option.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    if (message.sourceContext !== undefined) {
      SourceContext.encode(message.sourceContext, writer.uint32(34).fork()).ldelim();
    }
    if (message.syntax !== 0) {
      writer.uint32(40).int32(message.syntax);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Enum {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseEnum } as Enum;
    message.enumvalue = [];
    message.options = [];
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.name = reader.string();
          break;
        case 2:
          message.enumvalue.push(EnumValue.decode(reader, reader.uint32()));
          break;
        case 3:
          message.options.push(Option.decode(reader, reader.uint32()));
          break;
        case 4:
          message.sourceContext = SourceContext.decode(reader, reader.uint32());
          break;
        case 5:
          message.syntax = reader.int32() as any;
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Enum {
    const message = { ...baseEnum } as Enum;
    message.enumvalue = [];
    message.options = [];
    if (object.name !== undefined && object.name !== null) {
      message.name = String(object.name);
    } else {
      message.name = '';
    }
    if (object.enumvalue !== undefined && object.enumvalue !== null) {
      for (const e of object.enumvalue) {
        message.enumvalue.push(EnumValue.fromJSON(e));
      }
    }
    if (object.options !== undefined && object.options !== null) {
      for (const e of object.options) {
        message.options.push(Option.fromJSON(e));
      }
    }
    if (object.sourceContext !== undefined && object.sourceContext !== null) {
      message.sourceContext = SourceContext.fromJSON(object.sourceContext);
    } else {
      message.sourceContext = undefined;
    }
    if (object.syntax !== undefined && object.syntax !== null) {
      message.syntax = syntaxFromJSON(object.syntax);
    } else {
      message.syntax = 0;
    }
    return message;
  },

  toJSON(message: Enum): unknown {
    const obj: any = {};
    message.name !== undefined && (obj.name = message.name);
    if (message.enumvalue) {
      obj.enumvalue = message.enumvalue.map((e) => (e ? EnumValue.toJSON(e) : undefined));
    } else {
      obj.enumvalue = [];
    }
    if (message.options) {
      obj.options = message.options.map((e) => (e ? Option.toJSON(e) : undefined));
    } else {
      obj.options = [];
    }
    message.sourceContext !== undefined &&
      (obj.sourceContext = message.sourceContext
        ? SourceContext.toJSON(message.sourceContext)
        : undefined);
    message.syntax !== undefined && (obj.syntax = syntaxToJSON(message.syntax));
    return obj;
  },

  fromPartial(object: DeepPartial<Enum>): Enum {
    const message = { ...baseEnum } as Enum;
    message.enumvalue = [];
    message.options = [];
    if (object.name !== undefined && object.name !== null) {
      message.name = object.name;
    } else {
      message.name = '';
    }
    if (object.enumvalue !== undefined && object.enumvalue !== null) {
      for (const e of object.enumvalue) {
        message.enumvalue.push(EnumValue.fromPartial(e));
      }
    }
    if (object.options !== undefined && object.options !== null) {
      for (const e of object.options) {
        message.options.push(Option.fromPartial(e));
      }
    }
    if (object.sourceContext !== undefined && object.sourceContext !== null) {
      message.sourceContext = SourceContext.fromPartial(object.sourceContext);
    } else {
      message.sourceContext = undefined;
    }
    if (object.syntax !== undefined && object.syntax !== null) {
      message.syntax = object.syntax;
    } else {
      message.syntax = 0;
    }
    return message;
  },
};

const baseEnumValue: object = { name: '', number: 0 };

export const EnumValue = {
  encode(message: EnumValue, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== '') {
      writer.uint32(10).string(message.name);
    }
    if (message.number !== 0) {
      writer.uint32(16).int32(message.number);
    }
    for (const v of message.options) {
      Option.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EnumValue {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseEnumValue } as EnumValue;
    message.options = [];
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.name = reader.string();
          break;
        case 2:
          message.number = reader.int32();
          break;
        case 3:
          message.options.push(Option.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): EnumValue {
    const message = { ...baseEnumValue } as EnumValue;
    message.options = [];
    if (object.name !== undefined && object.name !== null) {
      message.name = String(object.name);
    } else {
      message.name = '';
    }
    if (object.number !== undefined && object.number !== null) {
      message.number = Number(object.number);
    } else {
      message.number = 0;
    }
    if (object.options !== undefined && object.options !== null) {
      for (const e of object.options) {
        message.options.push(Option.fromJSON(e));
      }
    }
    return message;
  },

  toJSON(message: EnumValue): unknown {
    const obj: any = {};
    message.name !== undefined && (obj.name = message.name);
    message.number !== undefined && (obj.number = message.number);
    if (message.options) {
      obj.options = message.options.map((e) => (e ? Option.toJSON(e) : undefined));
    } else {
      obj.options = [];
    }
    return obj;
  },

  fromPartial(object: DeepPartial<EnumValue>): EnumValue {
    const message = { ...baseEnumValue } as EnumValue;
    message.options = [];
    if (object.name !== undefined && object.name !== null) {
      message.name = object.name;
    } else {
      message.name = '';
    }
    if (object.number !== undefined && object.number !== null) {
      message.number = object.number;
    } else {
      message.number = 0;
    }
    if (object.options !== undefined && object.options !== null) {
      for (const e of object.options) {
        message.options.push(Option.fromPartial(e));
      }
    }
    return message;
  },
};

const baseOption: object = { name: '' };

export const Option = {
  encode(message: Option, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== '') {
      writer.uint32(10).string(message.name);
    }
    if (message.value !== undefined) {
      Any.encode(message.value, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Option {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseOption } as Option;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.name = reader.string();
          break;
        case 2:
          message.value = Any.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Option {
    const message = { ...baseOption } as Option;
    if (object.name !== undefined && object.name !== null) {
      message.name = String(object.name);
    } else {
      message.name = '';
    }
    if (object.value !== undefined && object.value !== null) {
      message.value = Any.fromJSON(object.value);
    } else {
      message.value = undefined;
    }
    return message;
  },

  toJSON(message: Option): unknown {
    const obj: any = {};
    message.name !== undefined && (obj.name = message.name);
    message.value !== undefined &&
      (obj.value = message.value ? Any.toJSON(message.value) : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<Option>): Option {
    const message = { ...baseOption } as Option;
    if (object.name !== undefined && object.name !== null) {
      message.name = object.name;
    } else {
      message.name = '';
    }
    if (object.value !== undefined && object.value !== null) {
      message.value = Any.fromPartial(object.value);
    } else {
      message.value = undefined;
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
