/* eslint-env jest */

import { PathElements } from 'a-msgpack';

import Parser, {
  decodeNotifications,
  decodePathElements,
  encodeNotifications,
  encodePathElementsAndKeysInQuery,
  sortTimestamp,
} from '../src/Parser';
import { DEVICE_DATASET_TYPE, GET, PUBLISH } from '../src/constants';
import {
  BatchPublishRequest,
  CloudVisionBatchedNotifications,
  CloudVisionNotifs,
  CloudVisionQueryMessage,
  CloudVisionRawNotifs,
  PublishRequest,
  RawNotification,
} from '../types';

import {
  encodedPath1,
  encodedPath2,
  encodedQuery,
  encodedQueryWithKeys,
  expectedFifthNotif,
  expectedFifthNotifNanos,
  expectedFirstNotif,
  expectedFirstNotifNanos,
  expectedFourthNotif,
  expectedFourthNotifNanos,
  expectedRootNotif,
  expectedRootNotifNanos,
  expectedSecondNotif,
  expectedSecondNotifNanos,
  expectedSixthNotif,
  expectedSixthNotifNanos,
  expectedThirdNotif,
  expectedThirdNotifNanos,
  fifthNotif,
  firstNotif,
  firstNotifPublishRaw,
  fourthNotif,
  fourthNotifPublishRaw,
  path1,
  path2,
  query,
  queryWithKeys,
  rootNotif,
  rootNotifPublishRaw,
  secondNotif,
  secondNotifPublishRaw,
  sixthNotif,
  sixthNotifPublishRaw,
  thirdNotif,
  thirdNotifPublishRaw,
} from './fixtures';

describe('encode/decode path elements', () => {
  test('encodePathElementsAndKeysInQuery just path elements', () => {
    const clonedQuery = JSON.parse(JSON.stringify(query));
    expect(encodePathElementsAndKeysInQuery(query)).toEqual(encodedQuery);
    expect(clonedQuery).toEqual(query);
  });

  test('encodePathElementsAndKeysInQuery with keys', () => {
    const clonedQuery = JSON.parse(JSON.stringify(queryWithKeys));
    expect(encodePathElementsAndKeysInQuery(queryWithKeys)).toEqual(encodedQueryWithKeys);
    expect(clonedQuery).toEqual(queryWithKeys);
  });

  test('decodePathElements', () => {
    const clonedEncodedPath1 = JSON.parse(JSON.stringify(encodedPath1));
    const clonedEncodedPath2 = JSON.parse(JSON.stringify(encodedPath2));
    expect(decodePathElements(clonedEncodedPath2)).toEqual(path2);
    expect(decodePathElements(clonedEncodedPath1)).toEqual(path1);
    expect(clonedEncodedPath2).toEqual(encodedPath2);
    expect(clonedEncodedPath1).toEqual(encodedPath1);
    expect(decodePathElements([])).toEqual<PathElements>([]);
  });
});

describe('Parser', () => {
  const encodedData: CloudVisionRawNotifs = {
    dataset: { type: DEVICE_DATASET_TYPE, name: 'Dodgers' },
    notifications: [firstNotif, secondNotif, thirdNotif, fourthNotif, sixthNotif],
  };

  describe('parse', () => {
    const batchedResult: CloudVisionBatchedNotifications = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'Dodgers' },
      metadata: {},
      notifications: {
        [JSON.stringify(path1)]: [
          expectedThirdNotif,
          expectedFirstNotif,
          expectedFourthNotif,
          expectedSixthNotif,
        ],
        [JSON.stringify(path2)]: [expectedSecondNotif],
      },
    };
    const batchedResultNanos: CloudVisionBatchedNotifications = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'Dodgers' },
      metadata: {},
      notifications: {
        [JSON.stringify(path1)]: [
          expectedThirdNotifNanos,
          expectedFirstNotifNanos,
          expectedFourthNotifNanos,
          expectedSixthNotifNanos,
        ],
        [JSON.stringify(path2)]: [expectedSecondNotifNanos],
      },
    };

    const rawResult: CloudVisionNotifs = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'Dodgers' },
      metadata: {},
      notifications: [
        expectedThirdNotif,
        expectedFirstNotif,
        expectedSecondNotif,
        expectedFourthNotif,
        expectedSixthNotif,
      ],
    };
    const rawResultNanos: CloudVisionNotifs = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'Dodgers' },
      metadata: {},
      notifications: [
        expectedThirdNotifNanos,
        expectedFirstNotifNanos,
        expectedSecondNotifNanos,
        expectedFourthNotifNanos,
        expectedSixthNotifNanos,
      ],
    };
    const data = {
      result: encodedData,
      status: {},
      token: 'someToken',
    };
    const expectedBatchData = {
      result: batchedResult,
      status: {},
      token: 'someToken',
    };
    const expectedBatchDataNanos = {
      result: batchedResultNanos,
      status: {},
      token: 'someToken',
    };
    const expectedRawFormat = {
      result: rawResult,
      status: {},
      token: 'someToken',
    };
    const expectedRawFormatNanos = {
      result: rawResultNanos,
      status: {},
      token: 'someToken',
    };

    test('decode messages in batch format (Nanos)', () => {
      expect(Parser.parse(JSON.stringify(data), true, true)).toEqual(expectedBatchDataNanos);
    });

    test('decode messages in batch format', () => {
      expect(Parser.parse(JSON.stringify(data), true, false)).toEqual(expectedBatchData);
    });

    test('decode messages in raw format (Nanos)', () => {
      expect(Parser.parse(JSON.stringify(data), false, true)).toEqual(expectedRawFormatNanos);
    });

    test('decode messages in raw format', () => {
      expect(Parser.parse(JSON.stringify(data), false, false)).toEqual(expectedRawFormat);
    });

    test('decode empty result (Nanos)', () => {
      expect(Parser.parse(JSON.stringify({}), false, true)).toEqual({
        result: undefined,
        status: undefined,
        token: undefined,
      });
    });

    test('decode empty result', () => {
      expect(Parser.parse(JSON.stringify({}), false, false)).toEqual({
        result: undefined,
        status: undefined,
        token: undefined,
      });
    });
  });

  describe('stringify', () => {
    const batchedResult: BatchPublishRequest = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'Dodgers' },
      notifications: {
        [JSON.stringify(path1)]: [
          firstNotifPublishRaw,
          secondNotifPublishRaw,
          thirdNotifPublishRaw,
          fourthNotifPublishRaw,
          sixthNotifPublishRaw,
        ],
      },
    };

    const rawResult: PublishRequest = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'Dodgers' },
      notifications: [
        firstNotifPublishRaw,
        secondNotifPublishRaw,
        thirdNotifPublishRaw,
        fourthNotifPublishRaw,
        sixthNotifPublishRaw,
      ],
    };

    const expectedPublishData: CloudVisionQueryMessage = {
      command: PUBLISH,
      token: 'someToken',
      params: {
        sync: true,
        batch: encodedData,
      },
    };

    test('encode messages given in batch format', () => {
      const publishBatchParams: CloudVisionQueryMessage = {
        command: PUBLISH,
        token: 'someToken',
        params: {
          sync: true,
          batch: batchedResult,
        },
      };
      const publishBatchParamsClone = JSON.parse(JSON.stringify(publishBatchParams));
      expect(JSON.parse(Parser.stringify(publishBatchParams))).toEqual(expectedPublishData);
      expect(publishBatchParams).toEqual(publishBatchParamsClone);
    });

    test('encode messages given in raw format', () => {
      const publishRawParams: CloudVisionQueryMessage = {
        command: PUBLISH,
        token: 'someToken',
        params: {
          sync: true,
          batch: rawResult,
        },
      };
      const publishRawParamsClone = JSON.parse(JSON.stringify(publishRawParams));
      expect(JSON.parse(Parser.stringify(publishRawParams))).toEqual(expectedPublishData);
      expect(publishRawParamsClone).toEqual(publishRawParams);
    });

    test('encode query message', () => {
      const queryParams: CloudVisionQueryMessage = {
        command: GET,
        token: 'someToken',
        params: {
          query: [
            {
              dataset: { name: 'Dodgers', type: DEVICE_DATASET_TYPE },
              paths: [{ path_elements: path1 }],
            },
          ],
        },
      };
      const expectedQueryParams: CloudVisionQueryMessage = {
        command: GET,
        token: 'someToken',
        params: {
          query: [
            {
              dataset: { name: 'Dodgers', type: DEVICE_DATASET_TYPE },
              paths: [{ path_elements: encodedPath1 }],
            },
          ],
        },
      };

      const expectedQueryParamsClone = JSON.parse(JSON.stringify(expectedQueryParams));
      expect(JSON.parse(Parser.stringify(queryParams))).toEqual(expectedQueryParams);
      expect(expectedQueryParamsClone).toEqual(expectedQueryParams);
    });
  });
});

describe('decodeNotifications', () => {
  test('should properly batch requests for multiple paths', () => {
    const notif: CloudVisionRawNotifs = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      notifications: [firstNotif, secondNotif, thirdNotif, fourthNotif],
    };
    const expectedNotif: CloudVisionBatchedNotifications = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      metadata: {},
      notifications: {
        [JSON.stringify(path1)]: [expectedThirdNotif, expectedFirstNotif, expectedFourthNotif],
        [JSON.stringify(path2)]: [expectedSecondNotif],
      },
    };
    const expectedNotifNanos: CloudVisionBatchedNotifications = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      metadata: {},
      notifications: {
        [JSON.stringify(path1)]: [
          expectedThirdNotifNanos,
          expectedFirstNotifNanos,
          expectedFourthNotifNanos,
        ],
        [JSON.stringify(path2)]: [expectedSecondNotifNanos],
      },
    };

    const decodedNotifNanos = decodeNotifications(notif, true, true);

    expect(decodedNotifNanos).toEqual(expectedNotifNanos);
    expect(decodedNotifNanos).not.toBe(expectedNotifNanos);

    const decodedNotif = decodeNotifications(notif, true, false);

    expect(decodedNotif).toEqual(expectedNotif);
    expect(decodedNotif).not.toBe(expectedNotif);
  });

  test('should properly batch requests for one path', () => {
    const notif: CloudVisionRawNotifs = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      notifications: [firstNotif, thirdNotif],
    };
    const expectedNotif: CloudVisionBatchedNotifications = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      metadata: {},
      notifications: {
        [JSON.stringify(path1)]: [expectedThirdNotif, expectedFirstNotif],
      },
    };

    const expectedNotifNanos: CloudVisionBatchedNotifications = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      metadata: {},
      notifications: {
        [JSON.stringify(path1)]: [expectedThirdNotifNanos, expectedFirstNotifNanos],
      },
    };

    const batchedNotifNanos = decodeNotifications(notif, true, true);

    expect(batchedNotifNanos).toEqual(expectedNotifNanos);
    expect(batchedNotifNanos).not.toBe(expectedNotifNanos);

    const batchedNotif = decodeNotifications(notif, true, false);

    expect(batchedNotif).toEqual(expectedNotif);
    expect(batchedNotif).not.toBe(expectedNotif);
  });

  test('should properly batch requests for the root path', () => {
    const notif: CloudVisionRawNotifs = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      notifications: [rootNotif],
    };
    const expectedNotif: CloudVisionBatchedNotifications = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      metadata: {},
      notifications: {
        [JSON.stringify([])]: [expectedRootNotif],
      },
    };
    const expectedNotifNanos: CloudVisionBatchedNotifications = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      metadata: {},
      notifications: {
        [JSON.stringify([])]: [expectedRootNotifNanos],
      },
    };

    const batchedNotifNanos = decodeNotifications(notif, true, true);

    expect(batchedNotifNanos).toEqual(expectedNotifNanos);
    expect(batchedNotifNanos).not.toBe(expectedNotifNanos);

    const batchedNotif = decodeNotifications(notif, true, false);

    expect(batchedNotif).toEqual(expectedNotif);
    expect(batchedNotif).not.toBe(expectedNotif);
  });

  test('should properly decode metadata when batched', () => {
    const notif: CloudVisionRawNotifs = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      metadata: { Dodgers: 'Rule!' },
      notifications: [firstNotif, thirdNotif],
    };
    const expectedNotif: CloudVisionBatchedNotifications = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      metadata: { Dodgers: 'Rule!' },
      notifications: {
        [JSON.stringify(path1)]: [expectedThirdNotif, expectedFirstNotif],
      },
    };
    const expectedNotifNanos: CloudVisionBatchedNotifications = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      metadata: { Dodgers: 'Rule!' },
      notifications: {
        [JSON.stringify(path1)]: [expectedThirdNotifNanos, expectedFirstNotifNanos],
      },
    };

    const batchedNotifNanos = decodeNotifications(notif, true, true);

    expect(batchedNotifNanos).toEqual(expectedNotifNanos);
    expect(batchedNotifNanos).not.toBe(expectedNotifNanos);

    const batchedNotif = decodeNotifications(notif, true, false);

    expect(batchedNotif).toEqual(expectedNotif);
    expect(batchedNotif).not.toBe(expectedNotif);
  });

  test('should properly decode non batch requests for multiple paths', () => {
    const notif: CloudVisionRawNotifs = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      notifications: [firstNotif, secondNotif, thirdNotif, fourthNotif],
    };
    const expectedNotif: CloudVisionNotifs = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      metadata: {},
      notifications: [
        expectedThirdNotif,
        expectedFirstNotif,
        expectedSecondNotif,
        expectedFourthNotif,
      ],
    };
    const expectedNotifNanos: CloudVisionNotifs = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      metadata: {},
      notifications: [
        expectedThirdNotifNanos,
        expectedFirstNotifNanos,
        expectedSecondNotifNanos,
        expectedFourthNotifNanos,
      ],
    };

    const decodedNotifNanos = decodeNotifications(notif, false, true);

    expect(decodedNotifNanos).toEqual(expectedNotifNanos);
    expect(decodedNotifNanos).not.toBe(expectedNotifNanos);

    const decodedNotif = decodeNotifications(notif, false, false);

    expect(decodedNotif).toEqual(expectedNotif);
    expect(decodedNotif).not.toBe(expectedNotif);
  });

  test('should properly decode non batch requests for for one path', () => {
    const notif: CloudVisionRawNotifs = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      notifications: [firstNotif, thirdNotif],
    };
    const expectedNotif: CloudVisionNotifs = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      metadata: {},
      notifications: [expectedThirdNotif, expectedFirstNotif],
    };

    const expectedNotifNanos: CloudVisionNotifs = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      metadata: {},
      notifications: [expectedThirdNotifNanos, expectedFirstNotifNanos],
    };

    const batchedNotifNanos = decodeNotifications(notif, false, true);

    expect(batchedNotifNanos).toEqual(expectedNotifNanos);
    expect(batchedNotifNanos).not.toBe(expectedNotifNanos);

    const batchedNotif = decodeNotifications(notif, false, false);

    expect(batchedNotif).toEqual(expectedNotif);
    expect(batchedNotif).not.toBe(expectedNotif);
  });

  test('should properly decode metadata when not batched', () => {
    const notif: CloudVisionRawNotifs = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      metadata: { Dodgers: 'Rule!' },
      notifications: [firstNotif, thirdNotif],
    };
    const expectedNotif: CloudVisionNotifs = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      metadata: { Dodgers: 'Rule!' },
      notifications: [expectedThirdNotif, expectedFirstNotif],
    };

    const expectedNotifNanos: CloudVisionNotifs = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      metadata: { Dodgers: 'Rule!' },
      notifications: [expectedThirdNotifNanos, expectedFirstNotifNanos],
    };

    const batchedNotifNanos = decodeNotifications(notif, false, true);

    expect(batchedNotifNanos).toEqual(expectedNotifNanos);
    expect(batchedNotifNanos).not.toBe(expectedNotifNanos);

    const batchedNotif = decodeNotifications(notif, false, false);

    expect(batchedNotif).toEqual(expectedNotif);
    expect(batchedNotif).not.toBe(expectedNotif);
  });

  test('should properly decode delete all', () => {
    const notif: CloudVisionRawNotifs = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      notifications: [firstNotif, sixthNotif],
    };
    const expectedNotif: CloudVisionBatchedNotifications = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      metadata: {},
      notifications: {
        [JSON.stringify(path1)]: [expectedFirstNotif, expectedSixthNotif],
      },
    };

    const expectedNotifNanos: CloudVisionBatchedNotifications = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      metadata: {},
      notifications: {
        [JSON.stringify(path1)]: [expectedFirstNotifNanos, expectedSixthNotifNanos],
      },
    };

    const decodedNotifNanos = decodeNotifications(notif, true, true);

    expect(decodedNotifNanos).toEqual(expectedNotifNanos);
    expect(decodedNotifNanos).not.toBe(expectedNotifNanos);

    const decodedNotif = decodeNotifications(notif, true, false);

    expect(decodedNotif).toEqual(expectedNotif);
    expect(decodedNotif).not.toBe(expectedNotif);
  });

  test('should properly sort out of order notifications within the batch', () => {
    const notif: CloudVisionRawNotifs = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      notifications: [fourthNotif, fifthNotif, firstNotif, thirdNotif],
    };
    const expectedNotif: CloudVisionNotifs = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      metadata: {},
      notifications: [
        expectedThirdNotif,
        expectedFirstNotif,
        expectedFifthNotif,
        expectedFourthNotif,
      ],
    };

    const expectedNotifNanos: CloudVisionNotifs = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      metadata: {},
      notifications: [
        expectedThirdNotifNanos,
        expectedFirstNotifNanos,
        expectedFifthNotifNanos,
        expectedFourthNotifNanos,
      ],
    };

    const batchedNotifNanos = decodeNotifications(notif, false, true);

    expect(batchedNotifNanos).toEqual(expectedNotifNanos);
    expect(batchedNotifNanos).not.toBe(expectedNotifNanos);

    const batchedNotif = decodeNotifications(notif, false, false);

    expect(batchedNotif).toEqual(expectedNotif);
    expect(batchedNotif).not.toBe(expectedNotif);
  });
});

describe('encodeNotifications', () => {
  const rawNotifs: PublishRequest = {
    dataset: { type: DEVICE_DATASET_TYPE, name: 'Dodgers' },
    notifications: [
      rootNotifPublishRaw,
      firstNotifPublishRaw,
      secondNotifPublishRaw,
      thirdNotifPublishRaw,
      fourthNotifPublishRaw,
    ],
  };

  const batchedNotifs: BatchPublishRequest = {
    dataset: { type: DEVICE_DATASET_TYPE, name: 'Dodgers' },
    notifications: {
      [JSON.stringify(path1)]: [
        rootNotifPublishRaw,
        firstNotifPublishRaw,
        secondNotifPublishRaw,
        thirdNotifPublishRaw,
        fourthNotifPublishRaw,
      ],
    },
  };

  const encodedNotifs: CloudVisionRawNotifs = {
    dataset: { type: DEVICE_DATASET_TYPE, name: 'Dodgers' },
    notifications: [rootNotif, firstNotif, secondNotif, thirdNotif, fourthNotif],
  };

  test('should properly encode raw CloudVision notifications', () => {
    expect(encodeNotifications(rawNotifs)).toEqual(encodedNotifs);
  });

  test('should properly encode CloudVision notifications with no path_elements', () => {
    const emptyPathElementNotif = {
      timestamp: { seconds: 1539822631, nanos: 883496 },
      updates: [
        {
          key: 'Basketball',
          value: 'NBA',
        },
      ],
    };
    const emptyPathElementEncoded = {
      timestamp: { seconds: 1539822631, nanos: 883496 },
      updates: [
        {
          key: 'xApCYXNrZXRiYWxs',
          value: 'xANOQkE=',
        },
      ],
    };
    const notifs: PublishRequest = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'Dodgers' },
      notifications: [emptyPathElementNotif],
    };
    const encoded: CloudVisionRawNotifs = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'Dodgers' },
      notifications: [emptyPathElementEncoded],
    };

    expect(encodeNotifications(notifs)).toEqual(encoded);
  });

  test('should properly encode batched CloudVision notifications', () => {
    expect(encodeNotifications(batchedNotifs)).toEqual(encodedNotifs);
  });
});

describe('sortTimestamp', () => {
  const t1: RawNotification = { timestamp: { seconds: 99, nanos: 18 } };
  const t2: RawNotification = { timestamp: { seconds: 22, nanos: 74 } };
  const t3: RawNotification = { timestamp: { seconds: 10, nanos: 35 } };
  const t4: RawNotification = { timestamp: { seconds: 10, nanos: 31 } };
  const t5: RawNotification = { timestamp: { seconds: 30, nanos: 14 } };
  const t6: RawNotification = { timestamp: { seconds: 30 } };

  test('should return 1 if the seconds in the first element are larger', () => {
    expect(sortTimestamp(t1, t2)).toBe(1);
  });

  test('should return -1 if the seconds in the first element are smaller', () => {
    expect(sortTimestamp(t2, t1)).toBe(-1);
  });

  test('should return 1 if the seconds are equal and the nanos in first element are larger', () => {
    expect(sortTimestamp(t3, t4)).toBe(1);
  });

  test('should return -1 if the seconds are equal and the nanos in first element are smaller', () => {
    expect(sortTimestamp(t4, t3)).toBe(-1);
  });

  test('should return 1 if the seconds are equal and there are no nanos in the second element', () => {
    expect(sortTimestamp(t5, t6)).toBe(1);
  });

  test('should return -1 if the seconds are equal and there are no nanos in the first element', () => {
    expect(sortTimestamp(t6, t5)).toBe(-1);
  });

  test('should return 0 if the seconds and nanos are equal', () => {
    expect(sortTimestamp(t1, t1)).toBe(0);
  });
});
