import { grpc } from '@improbable-eng/grpc-web';
import type { GrpcControlErrorMessage } from '@types';

export const INITIAL_SYNC_COMPLETE = 'INITIAL_SYNC_COMPLETE';

export const INITIAL_SYNC_COMPLETE_MESSAGE: GrpcControlErrorMessage = {
  error: {
    code: grpc.Code.OK,
    message: INITIAL_SYNC_COMPLETE,
  },
};
