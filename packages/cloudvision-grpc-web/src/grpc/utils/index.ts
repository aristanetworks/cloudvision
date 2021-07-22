import { buffer, filter } from 'rxjs/operators';

import { GrpcCodeWithMessage, GrpcSource } from '../../../types';

/**
 * Will apply a buffer to the streams notifications and will only flush the
 * buffer once it encounters the flush message provided.
 *
 * @param resourceSource The GRPC service method definition to be queried.
 * @param flushMessage The message that when encountered triggers the buffer flush
 * @returns An object with the properties `data` and `message`, which are
 * [RXJS Observables](https://rxjs.dev/api/index/class/Observable) that can be subscribed to.
 */
export function bufferStream<TResponse>(
  resourceSource: GrpcSource<TResponse>,
  flushMessage: GrpcCodeWithMessage,
): GrpcSource<TResponse[]> {
  const flushCondition = resourceSource.messages.pipe(
    filter(
      (msg) => msg.error?.code === flushMessage.code && msg.error?.message === flushMessage.message,
    ),
  );

  return {
    data: resourceSource.data.pipe(buffer(flushCondition)),
    messages: resourceSource.messages,
  };
}
