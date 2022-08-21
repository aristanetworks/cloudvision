import type { GrpcControlMessage, StreamingResourceResponse } from '@types';

import { grpc } from '@arista/grpc-web';

import { INITIAL_SYNC_COMPLETE_MESSAGE } from './constants';

export function isInitialSyncCompleteMessage(message: GrpcControlMessage): boolean {
  return (
    'error' in message &&
    message.error.code === INITIAL_SYNC_COMPLETE_MESSAGE.error.code &&
    message.error.message === INITIAL_SYNC_COMPLETE_MESSAGE.error.message
  );
}

export function isStreamResponse(
  response: grpc.ProtobufMessage,
): response is StreamingResourceResponse {
  return 'type' in response;
}
