/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable */
import Long from 'long';
import _m0 from '@arista/protobufjs/minimal';
import { Syntax, Option, syntaxFromJSON, syntaxToJSON } from '../../google/protobuf/type';
import { SourceContext } from '../../google/protobuf/source_context';

export const protobufPackage = 'google.protobuf';

/**
 * Api is a light-weight descriptor for an API Interface.
 *
 * Interfaces are also described as "protocol buffer services" in some contexts,
 * such as by the "service" keyword in a .proto file, but they are different
 * from API Services, which represent a concrete implementation of an interface
 * as opposed to simply a description of methods and bindings. They are also
 * sometimes simply referred to as "APIs" in other contexts, such as the name of
 * this message itself. See https://cloud.google.com/apis/design/glossary for
 * detailed terminology.
 */
export interface Api {
  /**
   * The fully qualified name of this interface, including package name
   * followed by the interface's simple name.
   */
  name: string;
  /** The methods of this interface, in unspecified order. */
  methods: Method[];
  /** Any metadata attached to the interface. */
  options: Option[];
  /**
   * A version string for this interface. If specified, must have the form
   * `major-version.minor-version`, as in `1.10`. If the minor version is
   * omitted, it defaults to zero. If the entire version field is empty, the
   * major version is derived from the package name, as outlined below. If the
   * field is not empty, the version in the package name will be verified to be
   * consistent with what is provided here.
   *
   * The versioning schema uses [semantic
   * versioning](http://semver.org) where the major version number
   * indicates a breaking change and the minor version an additive,
   * non-breaking change. Both version numbers are signals to users
   * what to expect from different versions, and should be carefully
   * chosen based on the product plan.
   *
   * The major version is also reflected in the package name of the
   * interface, which must end in `v<major-version>`, as in
   * `google.feature.v1`. For major versions 0 and 1, the suffix can
   * be omitted. Zero major versions must only be used for
   * experimental, non-GA interfaces.
   */
  version: string;
  /**
   * Source context for the protocol buffer service represented by this
   * message.
   */
  sourceContext: SourceContext | undefined;
  /** Included interfaces. See [Mixin][]. */
  mixins: Mixin[];
  /** The source syntax of the service. */
  syntax: Syntax;
}

/** Method represents a method of an API interface. */
export interface Method {
  /** The simple name of this method. */
  name: string;
  /** A URL of the input message type. */
  requestTypeUrl: string;
  /** If true, the request is streamed. */
  requestStreaming: boolean;
  /** The URL of the output message type. */
  responseTypeUrl: string;
  /** If true, the response is streamed. */
  responseStreaming: boolean;
  /** Any metadata attached to the method. */
  options: Option[];
  /** The source syntax of this method. */
  syntax: Syntax;
}

/**
 * Declares an API Interface to be included in this interface. The including
 * interface must redeclare all the methods from the included interface, but
 * documentation and options are inherited as follows:
 *
 * - If after comment and whitespace stripping, the documentation
 *   string of the redeclared method is empty, it will be inherited
 *   from the original method.
 *
 * - Each annotation belonging to the service config (http,
 *   visibility) which is not set in the redeclared method will be
 *   inherited.
 *
 * - If an http annotation is inherited, the path pattern will be
 *   modified as follows. Any version prefix will be replaced by the
 *   version of the including interface plus the [root][] path if
 *   specified.
 *
 * Example of a simple mixin:
 *
 *     package google.acl.v1;
 *     service AccessControl {
 *       // Get the underlying ACL object.
 *       rpc GetAcl(GetAclRequest) returns (Acl) {
 *         option (google.api.http).get = "/v1/{resource=**}:getAcl";
 *       }
 *     }
 *
 *     package google.storage.v2;
 *     service Storage {
 *       rpc GetAcl(GetAclRequest) returns (Acl);
 *
 *       // Get a data record.
 *       rpc GetData(GetDataRequest) returns (Data) {
 *         option (google.api.http).get = "/v2/{resource=**}";
 *       }
 *     }
 *
 * Example of a mixin configuration:
 *
 *     apis:
 *     - name: google.storage.v2.Storage
 *       mixins:
 *       - name: google.acl.v1.AccessControl
 *
 * The mixin construct implies that all methods in `AccessControl` are
 * also declared with same name and request/response types in
 * `Storage`. A documentation generator or annotation processor will
 * see the effective `Storage.GetAcl` method after inheriting
 * documentation and annotations as follows:
 *
 *     service Storage {
 *       // Get the underlying ACL object.
 *       rpc GetAcl(GetAclRequest) returns (Acl) {
 *         option (google.api.http).get = "/v2/{resource=**}:getAcl";
 *       }
 *       ...
 *     }
 *
 * Note how the version in the path pattern changed from `v1` to `v2`.
 *
 * If the `root` field in the mixin is specified, it should be a
 * relative path under which inherited HTTP paths are placed. Example:
 *
 *     apis:
 *     - name: google.storage.v2.Storage
 *       mixins:
 *       - name: google.acl.v1.AccessControl
 *         root: acls
 *
 * This implies the following inherited HTTP annotation:
 *
 *     service Storage {
 *       // Get the underlying ACL object.
 *       rpc GetAcl(GetAclRequest) returns (Acl) {
 *         option (google.api.http).get = "/v2/acls/{resource=**}:getAcl";
 *       }
 *       ...
 *     }
 */
export interface Mixin {
  /** The fully qualified name of the interface which is included. */
  name: string;
  /**
   * If non-empty specifies a path under which inherited HTTP paths
   * are rooted.
   */
  root: string;
}

const baseApi: object = { name: '', version: '', syntax: 0 };

export const Api = {
  encode(message: Api, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== '') {
      writer.uint32(10).string(message.name);
    }
    for (const v of message.methods) {
      Method.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.options) {
      Option.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    if (message.version !== '') {
      writer.uint32(34).string(message.version);
    }
    if (message.sourceContext !== undefined) {
      SourceContext.encode(message.sourceContext, writer.uint32(42).fork()).ldelim();
    }
    for (const v of message.mixins) {
      Mixin.encode(v!, writer.uint32(50).fork()).ldelim();
    }
    if (message.syntax !== 0) {
      writer.uint32(56).int32(message.syntax);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Api {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseApi } as Api;
    message.methods = [];
    message.options = [];
    message.mixins = [];
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.name = reader.string();
          break;
        case 2:
          message.methods.push(Method.decode(reader, reader.uint32()));
          break;
        case 3:
          message.options.push(Option.decode(reader, reader.uint32()));
          break;
        case 4:
          message.version = reader.string();
          break;
        case 5:
          message.sourceContext = SourceContext.decode(reader, reader.uint32());
          break;
        case 6:
          message.mixins.push(Mixin.decode(reader, reader.uint32()));
          break;
        case 7:
          message.syntax = reader.int32() as any;
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Api {
    const message = { ...baseApi } as Api;
    message.methods = [];
    message.options = [];
    message.mixins = [];
    if (object.name !== undefined && object.name !== null) {
      message.name = String(object.name);
    } else {
      message.name = '';
    }
    if (object.methods !== undefined && object.methods !== null) {
      for (const e of object.methods) {
        message.methods.push(Method.fromJSON(e));
      }
    }
    if (object.options !== undefined && object.options !== null) {
      for (const e of object.options) {
        message.options.push(Option.fromJSON(e));
      }
    }
    if (object.version !== undefined && object.version !== null) {
      message.version = String(object.version);
    } else {
      message.version = '';
    }
    if (object.sourceContext !== undefined && object.sourceContext !== null) {
      message.sourceContext = SourceContext.fromJSON(object.sourceContext);
    } else {
      message.sourceContext = undefined;
    }
    if (object.mixins !== undefined && object.mixins !== null) {
      for (const e of object.mixins) {
        message.mixins.push(Mixin.fromJSON(e));
      }
    }
    if (object.syntax !== undefined && object.syntax !== null) {
      message.syntax = syntaxFromJSON(object.syntax);
    } else {
      message.syntax = 0;
    }
    return message;
  },

  toJSON(message: Api): unknown {
    const obj: any = {};
    message.name !== undefined && (obj.name = message.name);
    if (message.methods) {
      obj.methods = message.methods.map((e) => (e ? Method.toJSON(e) : undefined));
    } else {
      obj.methods = [];
    }
    if (message.options) {
      obj.options = message.options.map((e) => (e ? Option.toJSON(e) : undefined));
    } else {
      obj.options = [];
    }
    message.version !== undefined && (obj.version = message.version);
    message.sourceContext !== undefined &&
      (obj.sourceContext = message.sourceContext
        ? SourceContext.toJSON(message.sourceContext)
        : undefined);
    if (message.mixins) {
      obj.mixins = message.mixins.map((e) => (e ? Mixin.toJSON(e) : undefined));
    } else {
      obj.mixins = [];
    }
    message.syntax !== undefined && (obj.syntax = syntaxToJSON(message.syntax));
    return obj;
  },

  fromPartial(object: DeepPartial<Api>): Api {
    const message = { ...baseApi } as Api;
    message.methods = [];
    message.options = [];
    message.mixins = [];
    if (object.name !== undefined && object.name !== null) {
      message.name = object.name;
    } else {
      message.name = '';
    }
    if (object.methods !== undefined && object.methods !== null) {
      for (const e of object.methods) {
        message.methods.push(Method.fromPartial(e));
      }
    }
    if (object.options !== undefined && object.options !== null) {
      for (const e of object.options) {
        message.options.push(Option.fromPartial(e));
      }
    }
    if (object.version !== undefined && object.version !== null) {
      message.version = object.version;
    } else {
      message.version = '';
    }
    if (object.sourceContext !== undefined && object.sourceContext !== null) {
      message.sourceContext = SourceContext.fromPartial(object.sourceContext);
    } else {
      message.sourceContext = undefined;
    }
    if (object.mixins !== undefined && object.mixins !== null) {
      for (const e of object.mixins) {
        message.mixins.push(Mixin.fromPartial(e));
      }
    }
    if (object.syntax !== undefined && object.syntax !== null) {
      message.syntax = object.syntax;
    } else {
      message.syntax = 0;
    }
    return message;
  },
};

const baseMethod: object = {
  name: '',
  requestTypeUrl: '',
  requestStreaming: false,
  responseTypeUrl: '',
  responseStreaming: false,
  syntax: 0,
};

export const Method = {
  encode(message: Method, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== '') {
      writer.uint32(10).string(message.name);
    }
    if (message.requestTypeUrl !== '') {
      writer.uint32(18).string(message.requestTypeUrl);
    }
    if (message.requestStreaming === true) {
      writer.uint32(24).bool(message.requestStreaming);
    }
    if (message.responseTypeUrl !== '') {
      writer.uint32(34).string(message.responseTypeUrl);
    }
    if (message.responseStreaming === true) {
      writer.uint32(40).bool(message.responseStreaming);
    }
    for (const v of message.options) {
      Option.encode(v!, writer.uint32(50).fork()).ldelim();
    }
    if (message.syntax !== 0) {
      writer.uint32(56).int32(message.syntax);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Method {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseMethod } as Method;
    message.options = [];
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.name = reader.string();
          break;
        case 2:
          message.requestTypeUrl = reader.string();
          break;
        case 3:
          message.requestStreaming = reader.bool();
          break;
        case 4:
          message.responseTypeUrl = reader.string();
          break;
        case 5:
          message.responseStreaming = reader.bool();
          break;
        case 6:
          message.options.push(Option.decode(reader, reader.uint32()));
          break;
        case 7:
          message.syntax = reader.int32() as any;
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Method {
    const message = { ...baseMethod } as Method;
    message.options = [];
    if (object.name !== undefined && object.name !== null) {
      message.name = String(object.name);
    } else {
      message.name = '';
    }
    if (object.requestTypeUrl !== undefined && object.requestTypeUrl !== null) {
      message.requestTypeUrl = String(object.requestTypeUrl);
    } else {
      message.requestTypeUrl = '';
    }
    if (object.requestStreaming !== undefined && object.requestStreaming !== null) {
      message.requestStreaming = Boolean(object.requestStreaming);
    } else {
      message.requestStreaming = false;
    }
    if (object.responseTypeUrl !== undefined && object.responseTypeUrl !== null) {
      message.responseTypeUrl = String(object.responseTypeUrl);
    } else {
      message.responseTypeUrl = '';
    }
    if (object.responseStreaming !== undefined && object.responseStreaming !== null) {
      message.responseStreaming = Boolean(object.responseStreaming);
    } else {
      message.responseStreaming = false;
    }
    if (object.options !== undefined && object.options !== null) {
      for (const e of object.options) {
        message.options.push(Option.fromJSON(e));
      }
    }
    if (object.syntax !== undefined && object.syntax !== null) {
      message.syntax = syntaxFromJSON(object.syntax);
    } else {
      message.syntax = 0;
    }
    return message;
  },

  toJSON(message: Method): unknown {
    const obj: any = {};
    message.name !== undefined && (obj.name = message.name);
    message.requestTypeUrl !== undefined && (obj.requestTypeUrl = message.requestTypeUrl);
    message.requestStreaming !== undefined && (obj.requestStreaming = message.requestStreaming);
    message.responseTypeUrl !== undefined && (obj.responseTypeUrl = message.responseTypeUrl);
    message.responseStreaming !== undefined && (obj.responseStreaming = message.responseStreaming);
    if (message.options) {
      obj.options = message.options.map((e) => (e ? Option.toJSON(e) : undefined));
    } else {
      obj.options = [];
    }
    message.syntax !== undefined && (obj.syntax = syntaxToJSON(message.syntax));
    return obj;
  },

  fromPartial(object: DeepPartial<Method>): Method {
    const message = { ...baseMethod } as Method;
    message.options = [];
    if (object.name !== undefined && object.name !== null) {
      message.name = object.name;
    } else {
      message.name = '';
    }
    if (object.requestTypeUrl !== undefined && object.requestTypeUrl !== null) {
      message.requestTypeUrl = object.requestTypeUrl;
    } else {
      message.requestTypeUrl = '';
    }
    if (object.requestStreaming !== undefined && object.requestStreaming !== null) {
      message.requestStreaming = object.requestStreaming;
    } else {
      message.requestStreaming = false;
    }
    if (object.responseTypeUrl !== undefined && object.responseTypeUrl !== null) {
      message.responseTypeUrl = object.responseTypeUrl;
    } else {
      message.responseTypeUrl = '';
    }
    if (object.responseStreaming !== undefined && object.responseStreaming !== null) {
      message.responseStreaming = object.responseStreaming;
    } else {
      message.responseStreaming = false;
    }
    if (object.options !== undefined && object.options !== null) {
      for (const e of object.options) {
        message.options.push(Option.fromPartial(e));
      }
    }
    if (object.syntax !== undefined && object.syntax !== null) {
      message.syntax = object.syntax;
    } else {
      message.syntax = 0;
    }
    return message;
  },
};

const baseMixin: object = { name: '', root: '' };

export const Mixin = {
  encode(message: Mixin, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== '') {
      writer.uint32(10).string(message.name);
    }
    if (message.root !== '') {
      writer.uint32(18).string(message.root);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Mixin {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseMixin } as Mixin;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.name = reader.string();
          break;
        case 2:
          message.root = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Mixin {
    const message = { ...baseMixin } as Mixin;
    if (object.name !== undefined && object.name !== null) {
      message.name = String(object.name);
    } else {
      message.name = '';
    }
    if (object.root !== undefined && object.root !== null) {
      message.root = String(object.root);
    } else {
      message.root = '';
    }
    return message;
  },

  toJSON(message: Mixin): unknown {
    const obj: any = {};
    message.name !== undefined && (obj.name = message.name);
    message.root !== undefined && (obj.root = message.root);
    return obj;
  },

  fromPartial(object: DeepPartial<Mixin>): Mixin {
    const message = { ...baseMixin } as Mixin;
    if (object.name !== undefined && object.name !== null) {
      message.name = object.name;
    } else {
      message.name = '';
    }
    if (object.root !== undefined && object.root !== null) {
      message.root = object.root;
    } else {
      message.root = '';
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
