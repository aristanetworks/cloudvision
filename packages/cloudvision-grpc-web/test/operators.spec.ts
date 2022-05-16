import { ignoreElements, mergeMap, NEVER, throwError, timer } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { bufferOnce } from '../src/operators';

let testScheduler: TestScheduler;

beforeEach(() => {
  testScheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
});

describe('bufferOnce', () => {
  test('should emit buffer on source complete', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source = cold('1-2-3-|');
      const observable = source.pipe(bufferOnce(NEVER));

      expectObservable(observable).toBe('------(a|)', { a: ['1', '2', '3'] });
    });
  });

  test('should emit buffer on notifier next', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source = cold('1-2-3-4-5');
      const notifier = timer(5);
      const observable = source.pipe(bufferOnce(notifier));

      expectObservable(observable).toBe('-----(a|)', { a: ['1', '2', '3'] });
    });
  });

  test('should not emit buffer on notifier complete', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source = cold('1-2-3-4-5');
      const notifier = timer(5).pipe(ignoreElements());
      const observable = source.pipe(bufferOnce(notifier));

      expectObservable(observable).toBe('');
    });
  });

  test('should error on source error', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const error = 'oh no!';

      const source = cold('1-2#', undefined, error);
      const observable = source.pipe(bufferOnce(NEVER));

      expectObservable(observable).toBe('---#', undefined, error);
    });
  });

  test('should error on notifier error', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const error = 'oh no!';

      const source = cold('1-2-3-4-5');
      const notifier = timer(5).pipe(mergeMap(() => throwError(() => error)));
      const observable = source.pipe(bufferOnce(notifier));

      expectObservable(observable).toBe('-----#', undefined, error);
    });
  });
});
