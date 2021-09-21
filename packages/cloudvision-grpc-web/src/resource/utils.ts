import { GrpcSource } from '@types';

import { bufferUntilInitialSyncComplete } from './operators';

/**
 * Buffers a resource call until the "INITIAL_SYNC_COMPLETE" message is encountered.
 *
 * @param resourceSource The GRPC service method definition to be queried.
 * @returns An object with the properties `data` and `message`, which are
 * [RXJS Observables](https://rxjs.dev/api/index/class/Observable) that can be subscribed to.
 */
export function bufferResource<T>({ data, messages }: GrpcSource<T>): GrpcSource<T[]> {
  return {
    data: data.pipe(bufferUntilInitialSyncComplete(messages)),
    messages,
  };
}
