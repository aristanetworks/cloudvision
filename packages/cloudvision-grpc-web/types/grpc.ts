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
  error?: GrpcCodeWithMessage;
  metadata?: grpc.Metadata;
}

export interface ControlFunctions<T> {
  onEnd(
    controlMessageSubject: Subject<GrpcControlMessage>,
    dataSubject: Subject<T>,
    code: grpc.Code,
    message: string,
  ): void;
  onHeaders(
    controlMessageSubject: Subject<GrpcControlMessage>,
    dataSubject: Subject<T>,
    headers: grpc.Metadata,
  ): void;
  onMessage(
    controlMessageSubject: Subject<GrpcControlMessage>,
    dataSubject: Subject<T>,
    response: T,
  ): void;
}

/**
 * The [RXJS Observable](https://rxjs.dev/api/index/class/Observable) representing a GRPC
 * call. All data will be pushed to the `data` source and any metadata or errors
 * will be pushed to the `messages` source.
 */
export interface GrpcSource<T> {
  data: Observable<T>;
  messages: Observable<GrpcControlMessage>;
}

/**
 * Includes all [grpc invoke options](https://github.com/improbable-eng/grpc-web/blob/master/client/grpc-web/docs/invoke.md#invokerpcoptions)
 * except for `onMessage`, `onEnd` and `onHeaders`.
 */
export type RpcOptions<Req extends grpc.ProtobufMessage, Res extends grpc.ProtobufMessage> = Omit<
  grpc.InvokeRpcOptions<Req, Res>,
  'onEnd' | 'onHeaders' | 'onMessage'
>;
