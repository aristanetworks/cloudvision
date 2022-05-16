import type { GrpcControlMessage } from '@types';
import { filter, Observable, OperatorFunction } from 'rxjs';

import { bufferOnce } from '../operators';

import { isInitialSyncCompleteMessage } from './utils';

export function bufferUntilInitialSyncComplete<T>(
  message$: Observable<GrpcControlMessage>,
): OperatorFunction<T, T[]> {
  return bufferOnce(message$.pipe(filter(isInitialSyncCompleteMessage)));
}
