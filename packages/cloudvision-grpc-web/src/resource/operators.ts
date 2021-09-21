import { grpc } from '@improbable-eng/grpc-web';
import { GrpcControlMessage } from '@types';
import { Observable, OperatorFunction } from 'rxjs';

import { bufferUntilMessage } from '../grpc';

import { INITIAL_SYNC_COMPLETE } from './constants';

export function bufferUntilInitialSyncComplete<T>(
  message$: Observable<GrpcControlMessage>,
): OperatorFunction<T, T[]> {
  return bufferUntilMessage(message$, {
    code: grpc.Code.OK,
    message: INITIAL_SYNC_COMPLETE,
  });
}
