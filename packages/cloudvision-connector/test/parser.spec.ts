/* eslint-env jest */

import { GET, PUBLISH, DEVICE_DATASET_TYPE } from '../src/constants';
import Parser, {
  decodeNotifications,
  decodePathElements,
  encodeNotifications,
  encodePathElementsAndKeysInQuery,
  sortTimestamp,
} from '../src/parser';
import { PublishRequest } from '../types/query';

import {
  encodedPath1,
  encodedPath2,
  encodedQuery,
  encodedQueryWithKeys,
  expectedFifthNotif,
  expectedFirstNotif,
  expectedFourthNotif,
  expectedRootNotif,
  expectedSecondNotif,
  expectedSixthNotif,
  expectedThirdNotif,
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
    expect(decodePathElements([])).toEqual([]);
  });
});

describe('Parser', () => {
  const encodedData = {
    dataset: { type: DEVICE_DATASET_TYPE, name: 'Dodgers' },
    notifications: [firstNotif, secondNotif, thirdNotif, fourthNotif, sixthNotif],
  };

  describe('parse', () => {
    const batchedResult = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'Dodgers' },
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

    const rawResult = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'Dodgers' },
      notifications: [
        expectedThirdNotif,
        expectedFirstNotif,
        expectedSecondNotif,
        expectedFourthNotif,
        expectedSixthNotif,
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
    const expectedRawFormat = {
      result: rawResult,
      status: {},
      token: 'someToken',
    };

    test('decode messages in batch format', () => {
      expect(Parser.parse(JSON.stringify(data), true)).toEqual(expectedBatchData);
    });

    test('decode messages in raw format', () => {
      expect(Parser.parse(JSON.stringify(data), false)).toEqual(expectedRawFormat);
    });

    test('decode empty result', () => {
      expect(Parser.parse(JSON.stringify({}), false)).toEqual({
        result: undefined,
        status: undefined,
        token: undefined,
      });
    });
  });

  describe('stringify', () => {
    const batchedResult = {
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

    const expectedPublishData = {
      command: PUBLISH,
      token: 'someToken',
      params: {
        sync: true,
        batch: encodedData,
      },
    };

    test('encode messages given in batch format', () => {
      const publishBatchParams = {
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
      const publishRawParams = {
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
      const queryParams = {
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
      const expectedQueryParams = {
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
    const notif = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      notifications: [firstNotif, secondNotif, thirdNotif, fourthNotif],
    };
    const expectedNotif = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      notifications: {
        [JSON.stringify(path1)]: [expectedThirdNotif, expectedFirstNotif, expectedFourthNotif],
        [JSON.stringify(path2)]: [expectedSecondNotif],
      },
    };

    const decodedNotif = decodeNotifications(notif, true);

    expect(decodedNotif).toEqual(expectedNotif);
    expect(decodedNotif).not.toBe(expectedNotif);
  });

  test('should properly batch requests for one path', () => {
    const notif = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      notifications: [firstNotif, thirdNotif],
    };
    const expectedNotif = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      notifications: {
        [JSON.stringify(path1)]: [expectedThirdNotif, expectedFirstNotif],
      },
    };

    const batchedNotif = decodeNotifications(notif, true);

    expect(batchedNotif).toEqual(expectedNotif);
    expect(batchedNotif).not.toBe(expectedNotif);
  });

  test('should properly batch requests for the root path', () => {
    const notif = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      notifications: [rootNotif],
    };
    const expectedNotif = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      notifications: {
        [JSON.stringify([])]: [expectedRootNotif],
      },
    };

    const batchedNotif = decodeNotifications(notif, true);

    expect(batchedNotif).toEqual(expectedNotif);
    expect(batchedNotif).not.toBe(expectedNotif);
  });

  test('should properly decode non batch requests for multiple paths', () => {
    const notif = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      notifications: [firstNotif, secondNotif, thirdNotif, fourthNotif],
    };
    const expectedNotif = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      notifications: [
        expectedThirdNotif,
        expectedFirstNotif,
        expectedSecondNotif,
        expectedFourthNotif,
      ],
    };

    const decodedNotif = decodeNotifications(notif, false);

    expect(decodedNotif).toEqual(expectedNotif);
    expect(decodedNotif).not.toBe(expectedNotif);
  });

  test('should properly decode non batch requests for for one path', () => {
    const notif = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      notifications: [firstNotif, thirdNotif],
    };
    const expectedNotif = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      notifications: [expectedThirdNotif, expectedFirstNotif],
    };

    const batchedNotif = decodeNotifications(notif, false);

    expect(batchedNotif).toEqual(expectedNotif);
    expect(batchedNotif).not.toBe(expectedNotif);
  });

  test('should properly decode delete all', () => {
    const notif = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      notifications: [firstNotif, sixthNotif],
    };
    const expectedNotif = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      notifications: {
        [JSON.stringify(path1)]: [expectedFirstNotif, expectedSixthNotif],
      },
    };

    const decodedNotif = decodeNotifications(notif, true);

    expect(decodedNotif).toEqual(expectedNotif);
    expect(decodedNotif).not.toBe(expectedNotif);
  });

  test('should properly sort out of order notifications within the batch', () => {
    const notif = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      notifications: [fourthNotif, fifthNotif, firstNotif, thirdNotif],
    };
    const expectedNotif = {
      dataset: { type: DEVICE_DATASET_TYPE, name: 'device1' },
      notifications: [
        expectedThirdNotif,
        expectedFirstNotif,
        expectedFifthNotif,
        expectedFourthNotif,
      ],
    };

    const batchedNotif = decodeNotifications(notif, false);

    expect(batchedNotif).toEqual(expectedNotif);
    expect(batchedNotif).not.toBe(expectedNotif);
  });
});

describe('encodeNotifications', () => {
  const rawNotifs = {
    dataset: { type: DEVICE_DATASET_TYPE, name: 'Dodgers' },
    notifications: [
      rootNotifPublishRaw,
      firstNotifPublishRaw,
      secondNotifPublishRaw,
      thirdNotifPublishRaw,
      fourthNotifPublishRaw,
    ],
  };

  const batchedNotifs = {
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

  const encodedNotifs = {
    dataset: { type: DEVICE_DATASET_TYPE, name: 'Dodgers' },
    notifications: [rootNotif, firstNotif, secondNotif, thirdNotif, fourthNotif],
  };

  test('should properly encode raw CloudVision notifications', () => {
    expect(encodeNotifications(rawNotifs)).toEqual(encodedNotifs);
  });

  test('should properly encode batched CloudVision notifications', () => {
    expect(encodeNotifications(batchedNotifs)).toEqual(encodedNotifs);
  });
});

describe('sortTimestamp', () => {
  const t1 = { timestamp: { seconds: 99, nanos: 18 } };
  const t2 = { timestamp: { seconds: 22, nanos: 74 } };
  const t3 = { timestamp: { seconds: 10, nanos: 35 } };
  const t4 = { timestamp: { seconds: 10, nanos: 31 } };
  const t5 = { timestamp: { seconds: 30, nanos: 14 } };
  const t6 = { timestamp: { seconds: 30 } };

  it('should return 1 if the seconds in the first element are larger', () => {
    expect(sortTimestamp(t1, t2)).toEqual(1);
  });

  it('should return -1 if the seconds in the first element are smaller', () => {
    expect(sortTimestamp(t2, t1)).toEqual(-1);
  });

  it('should return 1 if the seconds are equal and the nanos in first element are larger', () => {
    expect(sortTimestamp(t3, t4)).toEqual(1);
  });

  it('should return -1 if the seconds are equal and the nanos in first element are smaller', () => {
    expect(sortTimestamp(t4, t3)).toEqual(-1);
  });

  it('should return 1 if the seconds are equal and there are no nanos in the second element', () => {
    expect(sortTimestamp(t5, t6)).toEqual(1);
  });

  it('should return -1 if the seconds are equal and there are no nanos in the first element', () => {
    expect(sortTimestamp(t6, t5)).toEqual(-1);
  });

  it('should return 0 if the seconds and nanos are equal', () => {
    expect(sortTimestamp(t1, t1)).toEqual(0);
  });
});
