import { Operation } from '@generated/arista/subscriptions/subscriptions';
import { grpc } from '@improbable-eng/grpc-web';
import {
  ControlFunctions,
  GrpcSource,
  ResourceRpcOptions,
  StreamingResourceResponse,
} from '@types';

import { fromGrpcInvoke } from '../grpc';

import { INITIAL_SYNC_COMPLETE } from './constants';

/**
 * Calls fromGrpcInvoke and adds some resource specific handling for stream
 * control messages that do not contain data, but are sent as data messages
 * This implements the special handleing for the `INITIAL_SYNC_COMPLETE` message.
 *
 * @param methodDescriptor The GRPC service method definition to be queried.
 * @param options Options to pass to eh GRPC call.
 * @returns An object with the properties `data` and `message`, which are
 * [RXJS Observables](https://rxjs.dev/api/index/class/Observable) that can be subscribed to.
 */
export function fromResourceGrpcInvoke<
  Req extends grpc.ProtobufMessage,
  Res extends StreamingResourceResponse,
>(
  methodDescriptor: grpc.MethodDefinition<Req, Res>,
  options: ResourceRpcOptions<Req, Res>,
): GrpcSource<Res> {
  const controlFunctions: Partial<ControlFunctions<Res>> = {
    onMessage(controlMessageSubject, dataSubject, response) {
      if (response.type === Operation.INITIAL_SYNC_COMPLETE) {
        controlMessageSubject.next({
          error: {
            code: grpc.Code.OK,
            message: INITIAL_SYNC_COMPLETE,
          },
        });
      } else {
        dataSubject.next(response);
      }
    },
  };

  return fromGrpcInvoke(methodDescriptor, options, controlFunctions);
}

export * from '@generated/arista/subscriptions/subscriptions';

export * from './constants';
export * from './operators';
export * from './utils';
