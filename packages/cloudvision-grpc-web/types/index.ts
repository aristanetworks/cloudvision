import { grpc } from '@improbable-eng/grpc-web';
import { Observable, Subject } from 'rxjs';

/**
 * Represents the combination of the GRPC code along with any message
 * detailing the failure.
 */
export interface GrpcCodeWithMessage {
  code: grpc.Code;
  message: string;
}

/**
 * Represents a GRPC control message. If the message is metadata, then the
 * `metadata` property will be specified. If the message is an error, the `error`
 * property will be populated.
 */
export interface GrpcControlMessage {
  metadata?: grpc.Metadata;
  error?: GrpcCodeWithMessage;
}

export interface ControlFunctions<TResponse> {
  onHeaders(
    controlMessageSubject: Subject<GrpcControlMessage>,
    _dataSubject: Subject<TResponse>,
    headers: grpc.Metadata,
  ): void;
  onMessage(
    _controlMessageSubject: Subject<GrpcControlMessage>,
    dataSubject: Subject<TResponse>,
    response: TResponse,
  ): void;
  onEnd(
    controlMessageSubject: Subject<GrpcControlMessage>,
    dataSubject: Subject<TResponse>,
    code: grpc.Code,
    message: string,
  ): void;
}

/**
 * The [RXJS Observable](https://rxjs.dev/api/index/class/Observable) representing a GRPC
 * call. All data will be pushed to the `data` source and any metadata or errors
 * will be pushed to the `messages` source.
 */
export interface GrpcSource<TResponse> {
  data: Observable<TResponse>;
  messages: Observable<GrpcControlMessage>;
}

/**
 * Includes all [grpc invoke options](https://github.com/improbable-eng/grpc-web/blob/master/client/grpc-web/docs/invoke.md#invokerpcoptions)
 * except for `onMessage`, `onEnd` and `onHeaders`.
 */
export type RpcOptions<
  TRequest extends grpc.ProtobufMessage,
  TResponse extends grpc.ProtobufMessage
> = Omit<grpc.InvokeRpcOptions<TRequest, TResponse>, 'onMessage' | 'onEnd' | 'onHeaders'>;

export * from './resource';
