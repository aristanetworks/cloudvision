import { Operation } from '@generated/arista/subscriptions/subscriptions';
import type { GrpcSource, ResourceRpcOptions } from '@types';
import { map, merge, Observable, partition } from 'rxjs';

import { grpc } from '@arista/grpc-web';

import { fromGrpcSource } from '../grpc';

import { INITIAL_SYNC_COMPLETE_MESSAGE } from './constants';
import { isStreamResponse } from './utils';

export * from '@generated/arista/subscriptions/subscriptions';

export * from './constants';
export * from './operators';
export * from './utils';

/**
 * Calls `fromGrpcSource` and adds some resource specific handling for stream control messages that
 * do not contain data, but are sent as data messages.
 * This implements the special handleing for the `INITIAL_SYNC_COMPLETE` message.
 *
 * @param methodDescriptor The GRPC service method definition to be queried.
 * @param options Options to pass to the GRPC call.
 */
export function fromResourceGrpcSource<
  Req extends grpc.ProtobufMessage,
  Res extends grpc.ProtobufMessage,
>(
  methodDescriptor: grpc.MethodDefinition<Req, Res>,
  options: ResourceRpcOptions<Req, Res>,
): Observable<GrpcSource<Res>> {
  return fromGrpcSource(methodDescriptor, options).pipe(
    // Move `INITIAL_SYNC_COMPLETE` response to control message stream
    map(({ data$, message$ }): GrpcSource<Res> => {
      const [initialSyncCompleteData$, otherData$] = partition(data$, (response) => {
        return isStreamResponse(response) && response.type === Operation.INITIAL_SYNC_COMPLETE;
      });
      const initialSyncCompleteMessage$ = initialSyncCompleteData$.pipe(
        map(() => INITIAL_SYNC_COMPLETE_MESSAGE),
      );

      return {
        data$: otherData$,
        message$: merge(message$, initialSyncCompleteMessage$),
      };
    }),
  );
}
