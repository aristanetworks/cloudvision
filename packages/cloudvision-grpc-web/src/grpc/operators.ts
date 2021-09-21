import { GrpcCodeWithMessage, GrpcControlMessage } from '@types';
import { filter, Observable, OperatorFunction } from 'rxjs';

import { bufferOnce } from '../operators';

export function bufferUntilMessage<T>(
  message$: Observable<GrpcControlMessage>,
  { code, message }: GrpcCodeWithMessage,
): OperatorFunction<T, T[]> {
  return bufferOnce(
    message$.pipe(filter(({ error }) => error?.code === code && error.message === message)),
  );
}
