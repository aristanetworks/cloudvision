import type { grpc } from '@improbable-eng/grpc-web';
import type { Observable } from 'rxjs';

export interface GrpcEnd {
  code: grpc.Code;
  message: string;
  trailers: grpc.Metadata;
}

export interface GrpcInvoke<T> {
  end$: Observable<GrpcEnd>;
  headers$: Observable<grpc.Metadata>;
  message$: Observable<T>;
}

/** Represents the combination of the GRPC code along with any message detailing the failure. */
export interface GrpcCodeWithMessage {
  code: grpc.Code;
  message: string;

  trailers?: grpc.Metadata;
}

export interface GrpcControlErrorMessage {
  error: GrpcCodeWithMessage;
}

export interface GrpcControlMetaDataMessage {
  metadata: grpc.Metadata;
}

export type GrpcControlMessage = GrpcControlErrorMessage | GrpcControlMetaDataMessage;

export interface GrpcSource<T> {
  /** gRPC response messages. */
  data$: Observable<T>;
  /** gRPC control messages. */
  message$: Observable<GrpcControlMessage>;
}

/**
 * Includes all [grpc invoke options](https://github.com/improbable-eng/grpc-web/blob/master/client/grpc-web/docs/invoke.md#invokerpcoptions)
 * except for `onMessage`, `onEnd` and `onHeaders`.
 */
export type RpcOptions<Req extends grpc.ProtobufMessage, Res extends grpc.ProtobufMessage> = Omit<
  grpc.InvokeRpcOptions<Req, Res>,
  'onEnd' | 'onHeaders' | 'onMessage'
>;
