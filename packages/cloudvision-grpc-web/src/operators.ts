import { ObservableInput, OperatorFunction, pipe, takeUntil, toArray } from 'rxjs';

/** Similar to `buffer`, except completes after the notifier emits. */
export function bufferOnce<T>(notifier: ObservableInput<unknown>): OperatorFunction<T, T[]> {
  return pipe(takeUntil(notifier), toArray());
}
