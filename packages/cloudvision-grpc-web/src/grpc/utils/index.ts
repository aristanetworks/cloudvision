import { buffer, filter, pipe } from 'wonka';

import { GrpcCodeWithMessage, GrpcSource } from '../../../types';

/**
 * Will apply a buffer to the streams notifications and will only flush the
 * buffer once it encounters the flush message provided.
 *
 * @param resourceSource The GRPC service method defintion to be queried.
 * @param flushMessage The message that when encountered triggers the buffer flush
 * @returns An object with the properties `data` and `message`, which are
 * [Sources](https://wonka.kitten.sh/api/sources) that can be subscribed to.
 */
export function bufferStream<TResponse>(
  resourceSource: GrpcSource<TResponse>,
  flushMessage: GrpcCodeWithMessage,
): GrpcSource<TResponse[]> {
  const flushCondition = pipe(
    resourceSource.messages,
    filter(
      (msg) => msg.error?.code === flushMessage.code && msg.error?.message === flushMessage.message,
    ),
  );

  return {
    data: pipe(resourceSource.data, buffer(flushCondition)),
    messages: resourceSource.messages,
  };
}
