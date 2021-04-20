import { grpc } from '@improbable-eng/grpc-web';
import { Source, Subject } from 'wonka';

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

export interface ControllFunctions<TResponse> {
  onHeaders(
    controllMessageSubject: Subject<GrpcControlMessage>,
    _dataSubject: Subject<TResponse>,
    headers: grpc.Metadata,
  ): void;
  onMessage(
    _controllMessageSubject: Subject<GrpcControlMessage>,
    dataSubject: Subject<TResponse>,
    response: TResponse,
  ): void;
  onEnd(
    controllMessageSubject: Subject<GrpcControlMessage>,
    dataSubject: Subject<TResponse>,
    code: grpc.Code,
    message: string,
  ): void;
}

/**
 * The [Wonka Source](https://wonka.kitten.sh/api/sources) representing a GRPC
 * call. All data will be pushed to the `data` source and any metadata or errors
 * will be pushed to the `messages` source.
 */
export interface GrpcSource<TResponse> {
  data: Source<TResponse>;
  messages: Source<GrpcControlMessage>;
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
