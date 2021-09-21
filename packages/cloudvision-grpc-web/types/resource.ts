import { Operation } from '@generated/arista/subscriptions/subscriptions';
import { grpc } from '@improbable-eng/grpc-web';

import { RpcOptions } from './grpc';

/**
 * A GRPC response the represents a response from a streaming resource.
 */
export interface StreamingResourceResponse extends grpc.ProtobufMessage {
  type?: Operation;
}

/**
 * Includes all [grpc invoke options](https://github.com/improbable-eng/grpc-web/blob/master/client/grpc-web/docs/invoke.md#invokerpcoptions)
 * except for `onMessage`, `onEnd` and `onHeaders` for a resource request.
 */
export type ResourceRpcOptions<
  Req extends grpc.ProtobufMessage,
  Res extends StreamingResourceResponse,
> = RpcOptions<Req, Res>;
