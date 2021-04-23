import { OperationMap } from '@generated/arista/subscriptions/subscriptions_pb';
import { grpc } from '@improbable-eng/grpc-web';

/**
 * A GRPC response the represents a response from a streaming resource.
 */
export interface StreamingResourceResponse extends grpc.ProtobufMessage {
  getType?(): OperationMap[keyof OperationMap];
  setType?(value: OperationMap[keyof OperationMap]): void;
}

/**
 * Includes all [grpc invoke options](https://github.com/improbable-eng/grpc-web/blob/master/client/grpc-web/docs/invoke.md#invokerpcoptions)
 * except for `onMessage`, `onEnd` and `onHeaders` for a resource request.
 */
export type ResourceRpcOptions<
  TRequest extends grpc.ProtobufMessage,
  TResponse extends StreamingResourceResponse
> = Omit<grpc.InvokeRpcOptions<TRequest, TResponse>, 'onMessage' | 'onEnd' | 'onHeaders'>;
