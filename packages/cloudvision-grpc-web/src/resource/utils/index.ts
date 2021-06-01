import { grpc } from '@improbable-eng/grpc-web';
import { GrpcSource } from '@types';

import { bufferStream } from '../../grpc';

/**
 * Buffers a resource call until the `INITIAL_SYNC_COMPLETE` message is encountered.
 *
 * @param resourceSource The GRPC service method definition to be queried.
 * @returns An object with the properties `data` and `message`, which are
 * [RXJS Observables](https://rxjs.dev/api/index/class/Observable) that can be subscribed to.
 */
export function bufferResource<TResponse>(
  resourceSource: GrpcSource<TResponse>,
): GrpcSource<TResponse[]> {
  return bufferStream(resourceSource, {
    code: grpc.Code.OK,
    message: 'INITIAL_SYNC_COMPLETE',
  });
}
