import { Operation } from '@generated/arista/subscriptions/subscriptions_pb';
import { grpc } from '@improbable-eng/grpc-web';
import {
  ControllFunctions,
  GrpcSource,
  ResourceRpcOptions,
  StreamingResourceResponse,
} from '@types';

import { fromGrpcInvoke } from '../grpc';

/**
 * Calls fromGrpcInvoke and adds some resource specific handling for stream
 * control messages that do not contain data, but are sent as data messages
 * This implements the special handleing for the `INITIAL_SYNC_COMPLETE` message.
 *
 * @param methodDescriptor The GRPC service method defintion to be queried.
 * @param options Options to pass to eh GRPC call.
 * @returns An object with the properties `data` and `message`, which are
 * [Sources](https://wonka.kitten.sh/api/sources) that can be subscribed to.
 */
export function fromResourceGrpcInvoke<
  TRequest extends grpc.ProtobufMessage,
  TResponse extends StreamingResourceResponse
>(
  methodDescriptor: grpc.MethodDefinition<TRequest, TResponse>,
  options: ResourceRpcOptions<TRequest, TResponse>,
): GrpcSource<TResponse> {
  const controllFunctions: ControllFunctions<TResponse> = {
    onHeaders: (controllMessageSubject, _dataSubject, headers) => {
      controllMessageSubject.next({ metadata: headers });
    },
    onMessage: (controllMessageSubject, dataSubject, response) => {
      const messageType = response.getType && response.getType();
      if (messageType === Operation.INITIAL_SYNC_COMPLETE) {
        // Should be a control message
        controllMessageSubject.next({
          error: {
            code: grpc.Code.OK,
            message: 'INITIAL_SYNC_COMPLETE',
          },
        });
      } else {
        dataSubject.next(response);
      }
    },
    onEnd: (controllMessageSubject, dataSubject, code, message) => {
      controllMessageSubject.next({ error: { code, message } });
      dataSubject.complete();
      controllMessageSubject.complete();
    },
  };

  return fromGrpcInvoke(methodDescriptor, options, controllFunctions);
}

export * from './utils';
